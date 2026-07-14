import bcrypt from "bcryptjs";

import { prisma } from "../database/prisma.js";
import { usersRepository } from "../repositories/users.repository.js";
import { HttpError } from "../utils/http-error.js";
import { getPermissions } from "../utils/permissions.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { uploadCnhPhoto } from "./photo-storage.service.js";
import { publishUsersUpdate } from "./realtime.service.js";

function toTokenUser(user: {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  role: { name: string };
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    departmentId: user.departmentId,
    role: user.role.name,
  };
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    department: string;
    cnh_number: string;
    cnh_expires_at: Date;
    cnh_photo_data_url: string;
  }) {
    const existingUser = await usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new HttpError(409, "JÃ¡ existe uma conta com este e-mail.");
    }

    if (data.cnh_expires_at.getTime() < Date.now()) {
      throw new HttpError(400, "A CNH informada esta vencida.");
    }
    const existingCnh = await prisma.user.findUnique({ where: { cnhNumber: data.cnh_number } });
    if (existingCnh) throw new HttpError(409, "Esta CNH ja esta cadastrada.");

    const [department, role] = await Promise.all([
      prisma.department.upsert({
        where: { name: data.department },
        update: {},
        create: { name: data.department },
      }),
      prisma.role.findUnique({ where: { name: "Colaborador" } }),
    ]);

    if (!role) {
      throw new HttpError(500, "Perfil Colaborador nÃ£o configurado.");
    }

    const cnhPhoto = await uploadCnhPhoto(data.cnh_photo_data_url, data.email);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        departmentId: department.id,
        roleId: role.id,
        active: true,
        cnhNumber: data.cnh_number,
        cnhExpiresAt: data.cnh_expires_at,
        cnhPhotoUrl: cnhPhoto.url,
        cnhPhotoPublicId: cnhPhoto.publicId,
        cnhStatus: "PENDING",
      },
      include: { department: true, role: true },
    });
    publishUsersUpdate(user.id);

    const tokenUser = toTokenUser(user);

    return {
      access_token: signAccessToken(tokenUser),
      refresh_token: signRefreshToken(tokenUser),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        cnhNumber: user.cnhNumber,
        cnhExpiresAt: user.cnhExpiresAt,
        cnhStatus: user.cnhStatus,
      },
      permissions: getPermissions(user.role.name),
    };
  },

  async login(email: string, password: string) {
    const user = await usersRepository.findByEmail(email);
    if (!user || !user.active) {
      throw new HttpError(401, "E-mail ou senha inválidos.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new HttpError(401, "E-mail ou senha inválidos.");
    }

    const tokenUser = toTokenUser(user);

    return {
      access_token: signAccessToken(tokenUser),
      refresh_token: signRefreshToken(tokenUser),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        cnhNumber: user.cnhNumber,
        cnhExpiresAt: user.cnhExpiresAt,
        cnhStatus: user.cnhStatus,
      },
      permissions: getPermissions(user.role.name),
    };
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { department: true, role: true },
    });

    if (!user || !user.active) {
      throw new HttpError(401, "Refresh token inválido.");
    }

    const tokenUser = toTokenUser(user);
    return {
      access_token: signAccessToken(tokenUser),
      refresh_token: signRefreshToken(tokenUser),
    };
  },

  async updateCnh(userId: string, data: { cnh_number: string; cnh_expires_at: Date; cnh_photo_data_url: string }) {
    if (data.cnh_expires_at.getTime() < Date.now()) {
      throw new HttpError(400, "A CNH informada esta vencida.");
    }
    const duplicate = await prisma.user.findFirst({
      where: { cnhNumber: data.cnh_number, id: { not: userId } },
    });
    if (duplicate) throw new HttpError(409, "Esta CNH ja esta cadastrada.");

    const photo = await uploadCnhPhoto(data.cnh_photo_data_url, userId);
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        cnhNumber: data.cnh_number,
        cnhExpiresAt: data.cnh_expires_at,
        cnhPhotoUrl: photo.url,
        cnhPhotoPublicId: photo.publicId,
        cnhStatus: "PENDING",
        cnhReviewedAt: null,
      },
      include: { department: true, role: true },
    });
    publishUsersUpdate(user.id);
    return {
      id: user.id, name: user.name, email: user.email, department: user.department, role: user.role,
      mustChangePassword: user.mustChangePassword, cnhNumber: user.cnhNumber,
      cnhExpiresAt: user.cnhExpiresAt, cnhStatus: user.cnhStatus,
    };
  },

  async changePassword(userId: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true, role: true },
    });

    if (!user || !user.active) {
      throw new HttpError(404, "Usuario nao encontrado.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
      include: { department: true, role: true },
    });
    publishUsersUpdate(updatedUser.id);

    const tokenUser = toTokenUser(updatedUser);
    return {
      access_token: signAccessToken(tokenUser),
      refresh_token: signRefreshToken(tokenUser),
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
        role: updatedUser.role,
        mustChangePassword: updatedUser.mustChangePassword,
        cnhNumber: updatedUser.cnhNumber,
        cnhExpiresAt: updatedUser.cnhExpiresAt,
        cnhStatus: updatedUser.cnhStatus,
      },
      permissions: getPermissions(updatedUser.role.name),
    };
  },
};

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
  }) {
    const existingUser = await usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new HttpError(409, "JÃ¡ existe uma conta com este e-mail.");
    }

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

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        departmentId: department.id,
        roleId: role.id,
        active: true,
      },
      include: { department: true, role: true },
    });

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
};

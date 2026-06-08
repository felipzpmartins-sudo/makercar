import bcrypt from "bcryptjs";

import { prisma } from "../database/prisma.js";
import { usersRepository } from "../repositories/users.repository.js";
import { HttpError } from "../utils/http-error.js";
import { publishUsersUpdate } from "./realtime.service.js";

const supremeOwnerEmail = "felipzpmartins@gmail.com";
const supremeOwnerRoleName = "Imperador Supremo";

const userSelect = {
  id: true,
  name: true,
  email: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  department: true,
  role: true,
};

async function assertRoleAssignmentIsAllowed(data: {
  email?: string;
  role_id?: string;
}) {
  if (!data.role_id) return;

  const role = await prisma.role.findUnique({
    where: { id: data.role_id },
  });
  if (!role) throw new HttpError(404, "Perfil nao encontrado.");

  if (
    role.name === supremeOwnerRoleName &&
    data.email?.toLowerCase() !== supremeOwnerEmail
  ) {
    throw new HttpError(
      403,
      "Somente a conta do dono pode receber o perfil Imperador Supremo.",
    );
  }
}

function assertSupremeOwnerIsNotRemoved(currentUser: {
  email: string;
  role: { name: string };
}, data: { email?: string; role_id?: string; active?: boolean }) {
  if (
    currentUser.email.toLowerCase() !== supremeOwnerEmail ||
    currentUser.role.name !== supremeOwnerRoleName
  ) {
    return;
  }

  if (data.email && data.email.toLowerCase() !== supremeOwnerEmail) {
    throw new HttpError(403, "A conta do dono nao pode trocar de e-mail.");
  }
  if (data.role_id) {
    throw new HttpError(403, "A conta do dono nao pode trocar de perfil.");
  }
  if (data.active === false) {
    throw new HttpError(403, "A conta do dono nao pode ser desativada.");
  }
}

export const usersService = {
  list() {
    return usersRepository.list();
  },

  async get(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw new HttpError(404, "Usuário não encontrado.");
    return user;
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    department_id: string;
    role_id: string;
    active?: boolean;
  }) {
    await assertRoleAssignmentIsAllowed({
      email: data.email,
      role_id: data.role_id,
    });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        departmentId: data.department_id,
        roleId: data.role_id,
        active: data.active ?? true,
      },
      select: userSelect,
    });
    publishUsersUpdate(user.id);
    return user;
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      department_id: string;
      role_id: string;
      active: boolean;
    }>,
  ) {
    const currentUser = await this.get(id);
    assertSupremeOwnerIsNotRemoved(currentUser, data);
    await assertRoleAssignmentIsAllowed({
      email: data.email ?? currentUser.email,
      role_id: data.role_id,
    });

    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        departmentId: data.department_id,
        roleId: data.role_id,
        active: data.active,
      },
      select: userSelect,
    });
    publishUsersUpdate(user.id);
    return user;
  },

  async delete(id: string) {
    const currentUser = await this.get(id);
    if (
      currentUser.email.toLowerCase() === supremeOwnerEmail &&
      currentUser.role.name === supremeOwnerRoleName
    ) {
      throw new HttpError(403, "A conta do dono nao pode ser excluida.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: userSelect,
    });
    publishUsersUpdate(user.id);
    return user;
  },
};

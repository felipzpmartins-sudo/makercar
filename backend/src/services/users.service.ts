import bcrypt from "bcryptjs";

import { prisma } from "../database/prisma.js";
import { usersRepository } from "../repositories/users.repository.js";
import { HttpError } from "../utils/http-error.js";
import { publishUsersUpdate } from "./realtime.service.js";

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
    await this.get(id);
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
    await this.get(id);
    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: userSelect,
    });
    publishUsersUpdate(user.id);
    return user;
  },
};

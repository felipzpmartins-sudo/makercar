import { env } from "../config/env.js";

export type RoleName =
  "Imperador Supremo" | "CEO" | "Administrador" | "Gestor" | "Colaborador";

export type Permission =
  | "users:manage"
  | "users:read"
  | "cnh:review"
  | "departments:read"
  | "vehicles:read"
  | "vehicles:manage"
  | "vehicles:reset-mileage"
  | "reservations:read-all"
  | "reservations:read-own"
  | "reservations:create"
  | "reservations:cancel-all"
  | "reservations:delete-history"
  | "reservations:finish"
  | "checklists:manage"
  | "dashboard:read"
  | "equipment:read"
  | "equipment:reserve"
  | "equipment:manage"
  | "equipment-reservations:read-all"
  | "equipment-reservations:review";

export const SUPREME_OWNER_EMAIL = env.SUPREME_OWNER_EMAIL;
export const SUPREME_OWNER_ROLE_NAME = "Imperador Supremo";

export const rolePermissions: Record<RoleName, Permission[]> = {
  "Imperador Supremo": [
    "users:manage",
    "users:read",
    "cnh:review",
    "departments:read",
    "vehicles:read",
    "vehicles:manage",
    "vehicles:reset-mileage",
    "reservations:read-all",
    "reservations:create",
    "reservations:cancel-all",
    "reservations:delete-history",
    "reservations:finish",
    "checklists:manage",
    "dashboard:read",
    "equipment:read",
    "equipment:reserve",
    "equipment:manage",
    "equipment-reservations:read-all",
    "equipment-reservations:review",
  ],
  CEO: [
    "users:read",
    "cnh:review",
    "departments:read",
    "vehicles:read",
    "vehicles:manage",
    "reservations:read-all",
    "reservations:create",
    "reservations:cancel-all",
    "reservations:finish",
    "checklists:manage",
    "dashboard:read",
    "equipment:read",
    "equipment:reserve",
    "equipment:manage",
    "equipment-reservations:read-all",
    "equipment-reservations:review",
  ],
  Administrador: [
    "users:read",
    "cnh:review",
    "departments:read",
    "vehicles:read",
    "vehicles:manage",
    "reservations:read-all",
    "reservations:create",
    "reservations:cancel-all",
    "reservations:finish",
    "checklists:manage",
    "dashboard:read",
    "equipment:read",
    "equipment:reserve",
    "equipment:manage",
    "equipment-reservations:read-all",
    "equipment-reservations:review",
  ],
  Gestor: [
    "departments:read",
    "vehicles:read",
    "reservations:read-own",
    "reservations:create",
    "equipment:read",
    "equipment:reserve",
  ],
  Colaborador: [
    "departments:read",
    "vehicles:read",
    "reservations:read-own",
    "reservations:create",
    "dashboard:read",
    "equipment:read",
    "equipment:reserve",
  ],
};

export function getPermissions(role: string): Permission[] {
  return rolePermissions[role as RoleName] ?? [];
}

export function hasPermission(role: string, permission: Permission) {
  return getPermissions(role).includes(permission);
}

export function isSupremeOwner(user?: { email?: string; role?: string }) {
  return (
    user?.email?.toLowerCase() === SUPREME_OWNER_EMAIL &&
    user.role === SUPREME_OWNER_ROLE_NAME
  );
}

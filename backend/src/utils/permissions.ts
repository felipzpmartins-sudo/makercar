export type RoleName = "CEO" | "Administrador" | "Gestor" | "Colaborador";

export type Permission =
  | "users:manage"
  | "departments:read"
  | "vehicles:read"
  | "vehicles:manage"
  | "reservations:read-all"
  | "reservations:read-own"
  | "reservations:create"
  | "reservations:approve"
  | "reservations:cancel-all"
  | "reservations:cancel-own"
  | "reservations:finish"
  | "checklists:manage"
  | "dashboard:read";

export const rolePermissions: Record<RoleName, Permission[]> = {
  CEO: [
    "users:manage",
    "departments:read",
    "vehicles:read",
    "vehicles:manage",
    "reservations:read-all",
    "reservations:create",
    "reservations:approve",
    "reservations:cancel-all",
    "reservations:finish",
    "checklists:manage",
    "dashboard:read",
  ],
  Administrador: [
    "users:manage",
    "departments:read",
    "vehicles:read",
    "vehicles:manage",
    "reservations:read-all",
    "reservations:create",
    "reservations:approve",
    "reservations:cancel-all",
    "reservations:finish",
    "checklists:manage",
    "dashboard:read",
  ],
  Gestor: [
    "departments:read",
    "vehicles:read",
    "reservations:read-all",
    "reservations:create",
    "reservations:approve",
    "reservations:cancel-all",
    "reservations:finish",
    "checklists:manage",
    "dashboard:read",
  ],
  Colaborador: [
    "departments:read",
    "vehicles:read",
    "reservations:read-own",
    "reservations:create",
    "reservations:cancel-own",
    "dashboard:read",
  ],
};

export function getPermissions(role: string): Permission[] {
  return rolePermissions[role as RoleName] ?? [];
}

export function hasPermission(role: string, permission: Permission) {
  return getPermissions(role).includes(permission);
}

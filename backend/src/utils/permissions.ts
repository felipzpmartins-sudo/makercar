export type RoleName =
  | "Imperador Supremo"
  | "CEO"
  | "Administrador"
  | "Gestor"
  | "Colaborador";

export type Permission =
  | "users:manage"
  | "departments:read"
  | "vehicles:read"
  | "vehicles:manage"
  | "vehicles:reset-mileage"
  | "reservations:read-all"
  | "reservations:read-own"
  | "reservations:create"
  | "reservations:cancel-all"
  | "reservations:cancel-own"
  | "reservations:delete-history"
  | "reservations:finish"
  | "checklists:manage"
  | "dashboard:read";

export const SUPREME_OWNER_EMAIL = "felipzpmartins@gmail.com";
export const SUPREME_OWNER_ROLE_NAME = "Imperador Supremo";

export const rolePermissions: Record<RoleName, Permission[]> = {
  "Imperador Supremo": [
    "users:manage",
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
  ],
  CEO: [
    "departments:read",
    "vehicles:read",
    "vehicles:manage",
    "reservations:read-all",
    "reservations:create",
    "reservations:cancel-all",
    "reservations:finish",
    "checklists:manage",
    "dashboard:read",
  ],
  Administrador: [
    "departments:read",
    "vehicles:read",
    "vehicles:manage",
    "reservations:read-all",
    "reservations:create",
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

export function isSupremeOwner(user?: { email?: string; role?: string }) {
  return (
    user?.email?.toLowerCase() === SUPREME_OWNER_EMAIL &&
    user.role === SUPREME_OWNER_ROLE_NAME
  );
}

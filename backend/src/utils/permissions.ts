import { env } from "../config/env.js";

export type RoleName =
  | "Imperador Supremo"
  | "CEO"
  | "Administrador"
  | "Administrador de Equipamentos"
  | "Gestor"
  | "Colaborador";

/*
 * Cargo dedicado ao modulo de equipamentos.
 *
 * Existe para separar as duas administracoes: quem cuida dos robos nao
 * precisa aprovar reserva de carro, mexer na frota nem revisar CNH. Na
 * pratica e um Colaborador com poder total sobre equipamentos.
 */
export const EQUIPMENT_ADMIN_ROLE_NAME = "Administrador de Equipamentos";

/** Cargos que ja administram equipamentos por serem administradores gerais. */
export const rolesWithEquipmentAdmin: RoleName[] = [
  "Imperador Supremo",
  "CEO",
  "Administrador",
  "Administrador de Equipamentos",
];

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
  "Administrador de Equipamentos": [
    // Frota: continua sendo um usuario comum.
    "departments:read",
    "vehicles:read",
    "reservations:read-own",
    "reservations:create",
    // Equipamentos: administra o modulo inteiro.
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

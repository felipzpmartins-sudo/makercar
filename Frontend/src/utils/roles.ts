export const SUPREME_OWNER_ROLE = "Imperador Supremo";

export function canAccessAdminRole(roleName?: string) {
  return [SUPREME_OWNER_ROLE, "CEO", "Administrador"].includes(roleName ?? "");
}

export function isSupremeOwnerRole(roleName?: string) {
  return roleName === SUPREME_OWNER_ROLE;
}

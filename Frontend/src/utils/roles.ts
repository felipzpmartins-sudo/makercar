export const SUPREME_OWNER_ROLE = "Imperador Supremo";

export function canAccessAdminRole(roleName?: string) {
  return [SUPREME_OWNER_ROLE, "CEO", "Administrador"].includes(roleName ?? "");
}

export function isSupremeOwnerRole(roleName?: string) {
  return roleName === SUPREME_OWNER_ROLE;
}

/**
 * Permissoes efetivas que o backend calculou para a sessao e devolveu no login.
 * Preferir esta checagem a comparar nome de perfil ou e-mail no cliente: o
 * backend continua sendo quem decide, e aqui so escondemos o que ele negaria.
 */
export function sessionHasPermission(permissions: string[] | undefined, permission: string) {
  return permissions?.includes(permission) ?? false;
}

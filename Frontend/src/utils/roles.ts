export const SUPREME_OWNER_ROLE = "Imperador Supremo";

export function canAccessAdminRole(roleName?: string) {
  return [SUPREME_OWNER_ROLE, "CEO", "Administrador"].includes(roleName ?? "");
}

/**
 * Administracao de equipamentos.
 *
 * Usa o mesmo conjunto de cargos do painel da frota: associar alguem a
 * "Administrador", "CEO" ou "Imperador Supremo" ja concede as permissoes de
 * equipamento (ver backend/src/utils/permissions.ts). Preferimos o cargo a
 * session.permissions porque o refresh de token renova apenas os tokens — as
 * permissoes gravadas no navegador podem estar desatualizadas ate o novo login.
 */
export function canManageEquipmentRole(roleName?: string) {
  return canAccessAdminRole(roleName);
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

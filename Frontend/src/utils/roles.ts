export const SUPREME_OWNER_ROLE = "Imperador Supremo";

/**
 * Cargo que administra so os equipamentos.
 *
 * Nao entra em canAccessAdminRole de proposito: quem tem este cargo cuida
 * dos robos, e nao da frota — nao deve ver o painel de veiculos nem revisar
 * CNH.
 */
export const EQUIPMENT_ADMIN_ROLE = "Administrador de Equipamentos";

export function canAccessAdminRole(roleName?: string) {
  return [SUPREME_OWNER_ROLE, "CEO", "Administrador"].includes(roleName ?? "");
}

/**
 * Administracao de equipamentos.
 *
 * Vale para os administradores gerais e para quem tem o cargo dedicado
 * (ver backend/src/utils/permissions.ts). Preferimos o cargo a
 * session.permissions porque o refresh de token renova apenas os tokens — as
 * permissoes gravadas no navegador podem estar desatualizadas ate o novo login.
 */
export function canManageEquipmentRole(roleName?: string) {
  return canAccessAdminRole(roleName) || roleName === EQUIPMENT_ADMIN_ROLE;
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

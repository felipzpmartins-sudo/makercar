/*
 * Acesso antecipado ao modulo de equipamentos.
 *
 * Enquanto o modulo esta em "em breve", a senha combinada fica guardada na
 * sessionStorage — e nao na localStorage — de proposito: vale enquanto a aba
 * estiver aberta e some ao fechar o navegador, que e o comportamento certo
 * para uma cortina temporaria.
 *
 * Isto e conveniencia de tela. Quem decide de verdade e o backend, que exige
 * a mesma senha na criacao da reserva.
 */

const EQUIPMENT_ACCESS_KEY = "makercar:equipment-access";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getStoredEquipmentAccess(): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.sessionStorage.getItem(EQUIPMENT_ACCESS_KEY);
  } catch {
    return null;
  }
}

export function saveEquipmentAccess(password: string) {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(EQUIPMENT_ACCESS_KEY, password);
  } catch {
    // Navegacao privada pode bloquear a escrita: o acesso vale so nesta tela.
  }
}

export function clearEquipmentAccess() {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.removeItem(EQUIPMENT_ACCESS_KEY);
  } catch {
    // Nada a fazer: sem storage nao ha o que limpar.
  }
}

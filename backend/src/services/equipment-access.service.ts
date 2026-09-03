import { timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

/*
 * Cortina de lancamento do modulo de equipamentos.
 *
 * Nao e um limite de seguranca e sim um "ainda nao": enquanto o modulo nao e
 * anunciado, quem chega nele ve o aviso de em breve e so passa com a senha
 * combinada. Mesma ideia da senha compartilhada do veiculo do suporte.
 *
 * Para abrir o modulo para todos, defina EQUIPMENT_MODULE_LOCKED=false no
 * ambiente. A senha continua configurada, mas deixa de ser exigida.
 */

export function isEquipmentModuleLocked() {
  return env.EQUIPMENT_MODULE_LOCKED;
}

/** Comparacao em tempo constante, como na senha do suporte. */
function matchesAccessPassword(password: string | undefined) {
  const received = Buffer.from(password ?? "");
  const expected = Buffer.from(env.EQUIPMENT_ACCESS_PASSWORD);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Exige a senha enquanto a cortina estiver de pe.
 *
 * Chamada tanto no desbloqueio da tela quanto na criacao da reserva: sem a
 * segunda, bastaria chamar a API direto para reservar com o modulo "fechado".
 */
export function assertEquipmentAccess(password: string | undefined) {
  if (!isEquipmentModuleLocked()) return;

  if (!matchesAccessPassword(password)) {
    throw new HttpError(
      403,
      "O módulo de equipamentos ainda não foi liberado. Informe a senha de acesso antecipado.",
    );
  }
}

export function getEquipmentAccessState() {
  return {
    locked: isEquipmentModuleLocked(),
    message: isEquipmentModuleLocked()
      ? "Reserva de equipamentos em breve. O acesso antecipado exige senha."
      : null,
  };
}

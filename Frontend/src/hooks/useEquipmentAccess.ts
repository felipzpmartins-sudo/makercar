import { useCallback, useEffect, useState } from "react";

import { equipmentService } from "@/services/equipmentService";
import { clearEquipmentAccess, getStoredEquipmentAccess } from "@/utils/equipmentAccess";

/*
 * Estado da cortina de lancamento do modulo de equipamentos.
 *
 * Quem manda e o servidor: ele diz se o modulo esta fechado e valida a senha.
 * Aqui so guardamos o resultado para a tela nao perguntar a senha de novo a
 * cada navegacao dentro da mesma aba.
 */
export function useEquipmentAccess() {
  const [isLocked, setIsLocked] = useState<boolean | undefined>(undefined);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function check() {
      try {
        const access = await equipmentService.getAccess();
        if (!isActive) return;

        setIsLocked(access.locked);
        if (!access.locked) {
          setIsUnlocked(true);
          return;
        }

        // Ja passou pela cortina nesta aba? Revalidamos a senha guardada: se
        // ela tiver sido trocada no ambiente, e melhor pedir de novo agora do
        // que deixar a pessoa preencher a reserva inteira para levar 403.
        const stored = getStoredEquipmentAccess();
        if (!stored) return;

        try {
          await equipmentService.unlock(stored);
          if (isActive) setIsUnlocked(true);
        } catch {
          clearEquipmentAccess();
        }
      } catch {
        // Sem resposta do servidor nao da para afirmar que esta liberado.
        // Manter fechado e o lado seguro do erro.
        if (isActive) setIsLocked(true);
      } finally {
        if (isActive) setIsChecking(false);
      }
    }

    void check();
    return () => {
      isActive = false;
    };
  }, []);

  const markUnlocked = useCallback(() => setIsUnlocked(true), []);

  return {
    /** `undefined` enquanto a resposta do servidor nao chegou. */
    isLocked,
    isUnlocked,
    isChecking,
    /** Libera a tela depois que o dialogo validou a senha. */
    markUnlocked,
    /** Precisa pedir a senha antes de deixar entrar. */
    needsPassword: isLocked === true && !isUnlocked,
  };
}

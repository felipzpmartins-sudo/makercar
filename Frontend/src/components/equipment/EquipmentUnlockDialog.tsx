import { KeyRound, Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { equipmentService } from "@/services/equipmentService";
import { saveEquipmentAccess } from "@/utils/equipmentAccess";

interface EquipmentUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois que o servidor aceita a senha. */
  onUnlocked: () => void;
}

/*
 * Senha de acesso antecipado.
 *
 * A validacao e feita no servidor, e nao comparando strings aqui: assim a
 * senha pode ser trocada pelo ambiente sem publicar uma versao nova, e o
 * mesmo segredo protege a criacao da reserva.
 */
export function EquipmentUnlockDialog({
  open,
  onOpenChange,
  onUnlocked,
}: EquipmentUnlockDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setError("");
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);
    setError("");
    try {
      await equipmentService.unlock(password.trim());
      saveEquipmentAccess(password.trim());
      onOpenChange(false);
      onUnlocked();
    } catch (unlockError) {
      setError(
        unlockError instanceof Error ? unlockError.message : "Não foi possível validar a senha.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary" aria-hidden />
            Reserva de equipamentos em breve
          </DialogTitle>
          <DialogDescription>
            O módulo ainda não foi liberado para a empresa. Se você recebeu a senha de acesso
            antecipado, informe abaixo para continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipmentAccessPassword">Senha de acesso antecipado</Label>
            {/*
              Nao e a senha de login. O Chrome ignora autoComplete="off" em campo
              de senha e preenchia aqui a credencial salva do site; "new-password"
              desliga isso, e os data-* fazem o mesmo nos gerenciadores.
            */}
            <Input
              id="equipmentAccessPassword"
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              required
              autoComplete="new-password"
              data-1p-ignore
              data-bwignore
              data-lpignore="true"
              data-form-type="other"
            />
            {error ? (
              <p className="rounded-lg border border-danger/25 bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-foreground">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-3 sm:items-center">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Voltar
            </Button>
            <Button type="submit" disabled={isSubmitting || !password.trim()}>
              <KeyRound className="h-4 w-4" />
              {isSubmitting ? "Validando..." : "Entrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

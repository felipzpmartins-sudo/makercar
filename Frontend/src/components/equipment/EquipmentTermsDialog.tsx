import { FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EquipmentTerms } from "@/data/equipment";
import { formatDateLabel } from "@/data/equipment";

interface EquipmentTermsDialogProps {
  open: boolean;
  terms?: EquipmentTerms | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  /** Marca o aceite ao fechar pelo botao de concordancia. Omitir em leitura avulsa. */
  onAccept?: () => void;
}

/*
 * Leitura completa do Termo de Responsabilidade.
 *
 * O texto vem do backend justamente para que a versao lida seja a mesma que a
 * reserva vai gravar — se alguem editar o termo entre a leitura e o envio, o
 * backend recusa e pede releitura.
 */
export function EquipmentTermsDialog({
  open,
  terms,
  isLoading = false,
  onOpenChange,
  onAccept,
}: EquipmentTermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-primary" />
            {terms?.title ?? "Termo de Responsabilidade"}
          </DialogTitle>
          <DialogDescription>
            {terms
              ? `Versão ${terms.version} · atualizado em ${formatDateLabel(terms.updatedAt)}`
              : "Carregando o texto vigente..."}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-slim max-h-[56vh] overflow-y-auto px-6 py-5">
          {isLoading || !terms ? (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
              Carregando o termo...
            </div>
          ) : (
            <div className="space-y-6">
              <p className="rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
                {terms.summary}
              </p>

              {terms.sections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                  <ul className="mt-2.5 space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground"
                      >
                        <span
                          className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onAccept ? (
            <Button
              type="button"
              disabled={!terms}
              onClick={() => {
                onAccept();
                onOpenChange(false);
              }}
            >
              Li e concordo
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { MessageCircle, MessageCircleWarning } from "lucide-react";

import { Button } from "@/components/ui/button";

/*
 * Aviso de urgencia nos checklists de retirada e devolucao.
 *
 * Fica junto do campo de observacoes porque e ali que a pessoa descreve o
 * problema. O ponto do aviso e deixar claro que o formulario e um registro,
 * nao um alerta: ninguem e notificado na hora em que ele e salvo. Se o
 * veiculo estiver com algo que impeca o uso, o suporte precisa saber pelo
 * WhatsApp no mesmo momento.
 *
 * Texto e contato ficam centralizados aqui para nao divergir entre os dois
 * modais — trocar o numero do suporte e mexer em uma linha so.
 */

/** Numero do suporte, so digitos e com DDI, no formato que o wa.me exige. */
const SUPPORT_WHATSAPP = "5519994410409";
const SUPPORT_WHATSAPP_LABEL = "(19) 99441-0409";
const SUPPORT_WHATSAPP_MESSAGE = "Olá! Preciso avisar sobre um veículo da frota MakerCar.";

const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
  SUPPORT_WHATSAPP_MESSAGE,
)}`;

export function UrgentWhatsAppNotice() {
  return (
    <div
      className="rounded-lg border border-warning/25 bg-warning-subtle p-3.5 text-sm text-warning-subtle-foreground"
      role="note"
    >
      <div className="flex items-start gap-3">
        <MessageCircleWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">Algo urgente com o veículo?</span> Registre aqui e avise o
          suporte também pelo WhatsApp — avaria, pane, luz de alerta acesa no painel ou qualquer
          situação que impeça o uso. Este formulário fica no histórico, mas não envia aviso na hora.
        </p>
      </div>
      <div className="mt-3 pl-7">
        <Button asChild variant="outline" size="sm">
          {/* Abre em outra aba: o formulario em preenchimento nao pode ser perdido. */}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Avisar o suporte no WhatsApp {SUPPORT_WHATSAPP_LABEL}
          </a>
        </Button>
      </div>
    </div>
  );
}

import { ArrowLeft, Bot, KeyRound, Lock } from "lucide-react";
import { useState } from "react";

import { ModuleHeader } from "@/components/ModuleHeader";
import { EquipmentUnlockDialog } from "@/components/equipment/EquipmentUnlockDialog";
import { Button } from "@/components/ui/button";

interface EquipmentComingSoonProps {
  userName: string;
  onLogout: () => void;
  onUnlocked: () => void;
}

/*
 * Tela de "em breve".
 *
 * Substitui o modulo inteiro enquanto ele nao e lancado — inclusive para quem
 * chega pela URL direta. Mostra os equipamentos que estao por vir, porque a
 * ideia e despertar interesse, e nao esconder que eles existem.
 */
export function EquipmentComingSoon({ userName, onLogout, onUnlocked }: EquipmentComingSoonProps) {
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ModuleHeader
        title="Equipamentos"
        subtitle="Reserva de equipamentos internos"
        icon={<Bot />}
        backHref="/"
        onLogout={onLogout}
      />

      <main className="mx-auto flex w-full max-w-[1080px] flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-fade-rise w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="eq-stage eq-grid relative flex h-56 items-end justify-center sm:h-72">
            <div className="eq-halo opacity-70" />
            <div className="eq-floor bottom-6 h-8 w-[52%]" />
            <div className="relative z-10 flex h-full w-full items-end justify-center gap-2 pb-4">
              <img
                src="/makercar-assets/robo-cachorro.png"
                alt="Robô Cachorro"
                decoding="async"
                className="max-h-[130px] w-auto object-contain opacity-90 drop-shadow-2xl sm:max-h-[170px]"
              />
              <img
                src="/makercar-assets/robo-humanoide.png"
                alt="Robô Humanoide"
                decoding="async"
                className="max-h-[175px] w-auto object-contain opacity-90 drop-shadow-2xl sm:max-h-[225px]"
              />
            </div>
          </div>

          <div className="p-6 text-center sm:p-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-subtle px-3 py-1 text-xs font-medium text-primary-subtle-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              Em breve
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Reserva de equipamentos chegando
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {userName.trim().split(/\s+/)[0]}, o módulo de equipamentos internos ainda está em
              preparação e as reservas não foram abertas. Assim que ele for liberado, o Robô
              Humanoide e o Robô Cachorro aparecerão aqui para agendamento.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                type="button"
                size="lg"
                onClick={() => setIsUnlockOpen(true)}
                className="shadow-sm hover:bg-primary"
              >
                <KeyRound className="h-4 w-4" />
                Tenho a senha de acesso
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para a Central
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <EquipmentUnlockDialog
        open={isUnlockOpen}
        onOpenChange={setIsUnlockOpen}
        onUnlocked={onUnlocked}
      />
    </div>
  );
}

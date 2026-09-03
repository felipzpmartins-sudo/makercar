import { ArrowLeft, LogOut, RefreshCw, UserCircle } from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/services/authClient";

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  currentUser?: AuthUser;
  /** Link do "voltar" — omitir na Central, que ja e a raiz. */
  backHref?: string;
  backLabel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onLogout?: () => void;
  /** Botoes proprios da tela, antes dos controles fixos. */
  actions?: ReactNode;
}

/*
 * Barra superior das telas de modulo (Central e Equipamentos).
 *
 * A frota mantem o Header proprio, com os botoes de reserva rapida que so
 * fazem sentido la. Aqui a barra e a mesma casca — altura, fundo translucido,
 * ordem dos controles — para a troca de modulo nao parecer troca de sistema.
 */
export function ModuleHeader({
  title,
  subtitle,
  icon,
  currentUser,
  backHref,
  backLabel = "Central de Reservas",
  onRefresh,
  isRefreshing = false,
  onLogout,
  actions,
}: ModuleHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {backHref ? (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
              title={`Voltar para ${backLabel}`}
            >
              <a href={backHref}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para {backLabel}</span>
              </a>
            </Button>
          ) : (
            <img
              src="/makercar-assets/site-icon.png"
              alt=""
              className="h-8 w-8 shrink-0 rounded-lg object-contain sm:h-10 sm:w-10"
            />
          )}

          {icon ? (
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary ring-1 ring-primary/15 sm:flex sm:h-10 sm:w-10 [&_svg]:h-5 [&_svg]:w-5">
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {title}
            </h1>
            {subtitle ? (
              // A frase completa so cabe a partir do tablet.
              <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <div className="hidden items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground lg:flex">
              <UserCircle className="h-4 w-4 text-primary" />
              <span className="max-w-40 truncate">{currentUser.name}</span>
            </div>
          ) : null}

          {actions}

          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Atualizar dados"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Atualizar dados</span>
            </Button>
          ) : null}

          <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />

          {onLogout ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onLogout}
              title="Sair"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

import { ArrowLeft, CalendarPlus, LogOut, RefreshCw, ShieldCheck, UserCircle } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/services/authClient";

const makercarLogo = "/makercar-assets/site-icon.png";

interface HeaderProps {
  /** Volta para a Central de Reservas. Omitir quando a tela ja e a raiz. */
  backHref?: string;
  onNewReservation: () => void;
  onAdminAccess?: () => void;
  currentUser?: AuthUser;
  canAccessAdmin?: boolean;
  onLogout?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({
  backHref,
  onNewReservation,
  onAdminAccess,
  currentUser,
  canAccessAdmin = false,
  onLogout,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between gap-2 px-3 py-1.5 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {backHref ? (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
              title="Voltar para a Central de Reservas"
            >
              <a href={backHref}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para a Central de Reservas</span>
              </a>
            </Button>
          ) : null}
          <a href={backHref ?? "#inicio"} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <img
              src={makercarLogo}
              alt="MakerCar"
              className="h-6 w-6 rounded-md object-contain sm:h-10 sm:w-10 sm:rounded-lg"
            />
            <span className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              MakerCar
            </span>
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <div className="hidden items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground md:flex">
              <UserCircle className="h-4 w-4 text-primary" />
              <span className="max-w-40 truncate">{currentUser.name}</span>
            </div>
          ) : null}
          {canAccessAdmin ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onAdminAccess}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="sr-only">Admin</span>
            </Button>
          ) : null}
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
          <Button
            type="button"
            size="icon"
            onClick={onNewReservation}
            className="h-8 w-8 shadow-sm hover:bg-primary sm:h-9 sm:w-9"
          >
            <CalendarPlus className="h-4 w-4" />
            <span className="sr-only">Nova reserva</span>
          </Button>
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

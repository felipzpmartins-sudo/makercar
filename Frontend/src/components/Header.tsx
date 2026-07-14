import { CalendarPlus, LogOut, ShieldCheck, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/services/authClient";

const makercarLogo = "/makercar-assets/site-icon.png";

interface HeaderProps {
  onNewReservation: () => void;
  onAdminAccess?: () => void;
  currentUser?: AuthUser;
  canAccessAdmin?: boolean;
  onLogout?: () => void;
}

export function Header({
  onNewReservation,
  onAdminAccess,
  currentUser,
  canAccessAdmin = false,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-1.5 sm:gap-4 sm:px-6 sm:py-4">
        <a href="#inicio" className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <img
            src={makercarLogo}
            alt="MakerCar"
            className="h-6 w-6 rounded-md object-contain sm:h-10 sm:w-10 sm:rounded-lg"
          />
          <span className="truncate text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
            MakerCar
          </span>
        </a>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {currentUser ? (
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 md:flex">
              <UserCircle className="h-4 w-4 text-blue-600" />
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
          <Button
            type="button"
            size="icon"
            onClick={onNewReservation}
            className="h-8 w-8 bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 sm:h-9 sm:w-9"
          >
            <CalendarPlus className="h-4 w-4" />
            <span className="sr-only">Nova reserva</span>
          </Button>
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

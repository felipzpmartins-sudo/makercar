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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#inicio" className="flex min-w-0 items-center gap-2">
          <img src={makercarLogo} alt="MakerCar" className="h-10 w-10 rounded-lg object-contain" />
          <span className="truncate text-lg font-semibold tracking-tight text-slate-950">
            MakerCar
          </span>
        </a>

        <div className="flex min-w-0 items-center gap-2">
          {currentUser ? (
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 md:flex">
              <UserCircle className="h-4 w-4 text-blue-600" />
              <span className="max-w-40 truncate">{currentUser.name}</span>
            </div>
          ) : null}
          {canAccessAdmin ? (
            <Button type="button" variant="outline" onClick={onAdminAccess}>
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
              <span className="sr-only sm:hidden">Admin</span>
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onNewReservation}
            className="bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
          >
            <CalendarPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova reserva</span>
            <span className="sr-only sm:hidden">Nova reserva</span>
          </Button>
          {onLogout ? (
            <Button type="button" variant="outline" size="icon" onClick={onLogout} title="Sair">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

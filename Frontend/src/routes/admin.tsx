import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Car,
  ClipboardList,
  LogOut,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { useState } from "react";

import { AdminPanel, type AdminSection } from "@/components/AdminPanel";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { Button } from "@/components/ui/button";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMakerCarState } from "@/hooks/useMakerCarState";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "MakerCar - Administração" },
      {
        name: "description",
        content: "Painel administrativo do MakerCar.",
      },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const { session, isCheckingSession, logout } = useAuthSession({ redirectToLogin: true });
  const { vehicles, reservations, changeVehicleStatus, cancelReservation } = useMakerCarState();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const isAdmin = ["CEO", "Administrador"].includes(session?.user.role.name ?? "");
  const { users, isLoadingUsers } = useAdminUsers(isAdmin);

  if (isCheckingSession || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Carregando acesso...
      </div>
    );
  }

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Indicadores",
      icon: <BarChart3 />,
    },
    {
      id: "usuarios",
      label: "Usuarios",
      description: "Contas cadastradas",
      icon: <Users />,
    },
    {
      id: "veiculos",
      label: "Veiculos",
      description: "Gestao da frota",
      icon: <Car />,
    },
    {
      id: "historicoVeiculos",
      label: "Por veiculo",
      description: "Historico individual",
      icon: <ClipboardList />,
    },
    {
      id: "historicoGeral",
      label: "Historico geral",
      description: "Filtros e acoes",
      icon: <ShieldCheck />,
    },
  ];

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-blue-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-950">Acesso administrativo restrito</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sua conta nao possui permissao para acessar este painel.
          </p>
          <Button asChild className="mt-5 bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/">Voltar ao sistema</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-950">Administração MakerCar</h1>
              <p className="text-sm text-slate-500">Painel administrativo em tela separada</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 md:flex">
              <UserCircle className="h-4 w-4 text-blue-600" />
              <span className="max-w-40 truncate">{session.user.name}</span>
            </div>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao sistema
              </Link>
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <PlatformSidebar
          title="Admin"
          items={navigationItems}
          activeId={activeSection}
          onSelect={(id) => setActiveSection(id as AdminSection)}
        />

        <main className="min-w-0">
          <AdminPanel
            isAdmin={isAdmin}
            activeSection={activeSection}
            vehicles={vehicles}
            reservations={reservations}
            users={users}
            isLoadingUsers={isLoadingUsers}
            onChangeVehicleStatus={changeVehicleStatus}
            onCancelReservation={cancelReservation}
            onRequestAccess={() => undefined}
          />
        </main>
      </div>
    </div>
  );
}

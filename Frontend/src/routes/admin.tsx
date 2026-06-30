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
import { toast } from "sonner";

import { AdminPanel, type AdminSection } from "@/components/AdminPanel";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { Button } from "@/components/ui/button";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMakerCarState } from "@/hooks/useMakerCarState";
import { reservationService } from "@/services/reservationService";
import { vehicleService } from "@/services/vehicleService";
import { canAccessAdminRole } from "@/utils/roles";
import { isSupremeOwnerRole } from "@/utils/roles";

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
  const { vehicles, reservations, refreshFleet, changeVehicleStatus, cancelReservation } =
    useMakerCarState();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const isAdmin = canAccessAdminRole(session?.user.role.name);
  const canManageUsers = isSupremeOwnerRole(session?.user.role.name);
  const canUseOwnerTools =
    canManageUsers && session?.user.email.toLowerCase() === "felipzpmartins@gmail.com";
  const { users, roles, isLoadingUsers, changeUserRole, deleteUser, resetUserPassword } =
    useAdminUsers(canManageUsers);

  async function deleteReservationHistory(reservationId: string) {
    try {
      await reservationService.deleteHistory(reservationId);
      await refreshFleet();
      toast.success("Historico excluido.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o historico.");
      return false;
    }
  }

  async function resetVehicleMileage(vehicleId: string) {
    try {
      await vehicleService.resetVehicleMileage(vehicleId);
      await refreshFleet();
      toast.success("KM do veiculo zerado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel zerar o KM.");
      return false;
    }
  }

  if (isCheckingSession || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Carregando acesso...
      </div>
    );
  }

  if (session.user.mustChangePassword) {
    return <PasswordChangeRequired session={session} onLogout={logout} />;
  }

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Indicadores",
      icon: <BarChart3 />,
    },
    ...(canManageUsers
      ? [
          {
            id: "usuarios",
            label: "Usuarios",
            description: "Contas cadastradas",
            icon: <Users />,
          },
        ]
      : []),
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
            roles={roles}
            isLoadingUsers={isLoadingUsers}
            canManageUsers={canManageUsers}
            canUseOwnerTools={canUseOwnerTools}
            currentUserId={session.user.id}
            onChangeUserRole={changeUserRole}
            onDeleteUser={deleteUser}
            onResetUserPassword={resetUserPassword}
            onChangeVehicleStatus={changeVehicleStatus}
            onResetVehicleMileage={resetVehicleMileage}
            onCancelReservation={cancelReservation}
            onDeleteReservationHistory={deleteReservationHistory}
            onRequestAccess={() => undefined}
          />
        </main>
      </div>
    </div>
  );
}

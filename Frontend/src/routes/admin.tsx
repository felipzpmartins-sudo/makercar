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
import { FullPageLoader } from "@/components/LoadingStates";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { Button } from "@/components/ui/button";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMakerCarState } from "@/hooks/useMakerCarState";
import { reservationService } from "@/services/reservationService";
import { vehicleService } from "@/services/vehicleService";
import { canAccessAdminRole, isSupremeOwnerRole, sessionHasPermission } from "@/utils/roles";

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
  const {
    vehicles,
    reservations,
    refreshFleet,
    changeVehicleStatus,
    cancelReservation,
    transferReservation,
  } = useMakerCarState();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const isAdmin = canAccessAdminRole(session?.user.role.name);
  const canReviewCnh = isAdmin;
  const canManageUsers = isSupremeOwnerRole(session?.user.role.name);
  // Ferramentas do dono (zerar KM, excluir historico). O backend valida de novo
  // em isSupremeOwner(); aqui apenas escondemos o que ele negaria.
  const canUseOwnerTools =
    sessionHasPermission(session?.permissions, "reservations:delete-history") &&
    sessionHasPermission(session?.permissions, "vehicles:reset-mileage");
  const {
    users,
    roles,
    isLoadingUsers,
    changeUserRole,
    changeCnhStatus,
    deleteUser,
    resetUserPassword,
  } = useAdminUsers(canReviewCnh, canManageUsers);

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

  async function approveReservation(reservationId: string) {
    try {
      await reservationService.approve(reservationId);
      await refreshFleet();
      toast.success("Reserva aprovada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel aprovar a reserva.");
      return false;
    }
  }

  async function changeReservationVehicle(reservationId: string, vehicleId: string) {
    try {
      await reservationService.changeVehicle(reservationId, vehicleId);
      await refreshFleet();
      toast.success("Veiculo da reserva alterado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel trocar o veiculo.");
      return false;
    }
  }

  async function rejectReservation(reservationId: string, reason: string) {
    try {
      await reservationService.reject(reservationId, reason);
      await refreshFleet();
      toast.success("Reserva recusada.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel recusar a reserva.");
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

  async function changeVehicleSupportOnly(vehicleId: string, supportOnly: boolean) {
    try {
      await vehicleService.updateVehicleSupportOnly(vehicleId, supportOnly);
      await refreshFleet();
      toast.success(
        supportOnly
          ? "Veiculo definido como exclusivo do suporte."
          : "Exclusividade do suporte removida.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o veiculo.");
    }
  }

  async function updateVehicleMileage(vehicleId: string, mileage: number) {
    try {
      await vehicleService.updateVehicleMileage(vehicleId, mileage);
      await refreshFleet();
      toast.success("KM do veiculo atualizado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o KM.");
      return false;
    }
  }

  if (isCheckingSession || !session) {
    return <FullPageLoader label="Verificando seu acesso..." />;
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
    ...(canReviewCnh
      ? [
          {
            id: "usuarios",
            label: "CNH",
            description: "Documentos enviados",
            icon: <Users />,
          },
        ]
      : []),
    {
      id: "veiculos",
      label: "Veículos",
      description: "Gestão da frota",
      icon: <Car />,
    },
    {
      id: "historicoVeiculos",
      label: "Por veículo",
      description: "Histórico individual",
      icon: <ClipboardList />,
    },
    {
      id: "historicoGeral",
      label: "Histórico geral",
      description: "Filtros e ações",
      icon: <ShieldCheck />,
    },
  ];

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4 text-center">
        <div className="max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Acesso administrativo restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta nao possui permissao para acessar este painel.
          </p>
          <Button asChild className="mt-5">
            <Link to="/frota">Voltar ao sistema</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary ring-1 ring-primary/15 sm:h-10 sm:w-10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Administração
              </h1>
              {/* A frase completa so cabe a partir do tablet. */}
              <p className="hidden truncate text-sm text-muted-foreground sm:block">
                Painel administrativo em tela separada
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground md:flex">
              <UserCircle className="h-4 w-4 text-primary" />
              <span className="max-w-40 truncate">{session.user.name}</span>
            </div>
            <Button asChild variant="outline" className="px-2.5 sm:px-4" title="Voltar ao sistema">
              <Link to="/frota">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar ao sistema</span>
                <span className="sr-only sm:hidden">Voltar ao sistema</span>
              </Link>
            </Button>
            <ThemeToggle />
            <Button type="button" variant="outline" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid w-full gap-6 px-4 py-8 sm:px-6 xl:px-10 lg:grid-cols-[260px_minmax(0,1fr)]">
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
            canReviewCnh={canReviewCnh}
            canManageUsers={canManageUsers}
            canUseOwnerTools={canUseOwnerTools}
            currentUserId={session.user.id}
            onChangeUserRole={changeUserRole}
            onChangeCnhStatus={changeCnhStatus}
            onDeleteUser={deleteUser}
            onResetUserPassword={resetUserPassword}
            onChangeVehicleStatus={changeVehicleStatus}
            onChangeVehicleSupportOnly={changeVehicleSupportOnly}
            onUpdateVehicleMileage={updateVehicleMileage}
            onResetVehicleMileage={resetVehicleMileage}
            onCancelReservation={cancelReservation}
            onTransferReservation={transferReservation}
            onApproveReservation={approveReservation}
            onChangeReservationVehicle={changeReservationVehicle}
            onRejectReservation={rejectReservation}
            onDeleteReservationHistory={deleteReservationHistory}
            onRequestAccess={() => undefined}
          />
        </main>
      </div>
    </div>
  );
}

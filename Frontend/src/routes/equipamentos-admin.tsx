import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarDays, ClipboardList, PackageSearch, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { FullPageLoader, InlineLoader } from "@/components/LoadingStates";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { EquipmentAdminDashboard } from "@/components/equipment/EquipmentAdminDashboard";
import { EquipmentCalendar } from "@/components/equipment/EquipmentCalendar";
import { EquipmentInventoryPanel } from "@/components/equipment/EquipmentInventoryPanel";
import {
  EquipmentRequestsPanel,
  type RequestFilter,
} from "@/components/equipment/EquipmentRequestsPanel";
import { EquipmentReviewDialog } from "@/components/equipment/EquipmentReviewDialog";
import { Button } from "@/components/ui/button";
import type { EquipmentReservation } from "@/data/equipment";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useEquipmentState } from "@/hooks/useEquipmentState";
import { canManageEquipmentRole } from "@/utils/roles";

type AdminSection = "dashboard" | "solicitacoes" | "calendario" | "equipamentos";

export const Route = createFileRoute("/equipamentos-admin")({
  head: () => ({
    meta: [
      { title: "MakerCar - Administração de Equipamentos" },
      {
        name: "description",
        content: "Painel de aprovação das reservas de equipamentos internos da MKR.",
      },
    ],
  }),
  component: EquipamentosAdminRoute,
});

function EquipamentosAdminRoute() {
  const { session, isCheckingSession, logout } = useAuthSession({ redirectToLogin: true });
  const isEquipmentAdmin = canManageEquipmentRole(session?.user.role.name);

  const {
    equipments,
    allReservations,
    availability,
    summary,
    isLoading,
    refresh,
    approveReservation,
    rejectReservation,
    cancelReservation,
    completeReservation,
    changeEquipmentStatus,
  } = useEquipmentState({ withAdminData: isEquipmentAdmin });

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [requestsFilter, setRequestsFilter] = useState<RequestFilter>("Pendente");
  const [reviewingReservation, setReviewingReservation] = useState<EquipmentReservation>();

  if (isCheckingSession || !session) {
    return <FullPageLoader label="Verificando seu acesso..." />;
  }

  if (session.user.mustChangePassword) {
    return <PasswordChangeRequired session={session} onLogout={logout} />;
  }

  if (!isEquipmentAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-foreground">Acesso administrativo restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta não possui permissão para administrar as reservas de equipamentos.
          </p>
          <Button asChild className="mt-5">
            <a href="/equipamentos">Voltar para equipamentos</a>
          </Button>
        </div>
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
      id: "solicitacoes",
      label: "Solicitações",
      description: summary?.pending ? `${summary.pending} pendentes` : "Aprovar e recusar",
      icon: <ClipboardList />,
    },
    {
      id: "calendario",
      label: "Calendário",
      description: "Ocupação por equipamento",
      icon: <CalendarDays />,
    },
    {
      id: "equipamentos",
      label: "Equipamentos",
      description: "Disponibilidade",
      icon: <PackageSearch />,
    },
  ];

  /*
   * A reserva aberta no dialogo vem da lista, que e substituida a cada
   * recarga. Reler pelo id mantem o dialogo em sincronia com o servidor
   * depois de aprovar ou recusar.
   */
  const currentReview = reviewingReservation
    ? (allReservations.find((item) => item.id === reviewingReservation.id) ?? reviewingReservation)
    : undefined;

  function openRequest(reservation: EquipmentReservation) {
    setReviewingReservation(reservation);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ModuleHeader
        title="Administração de Equipamentos"
        subtitle="Aprovações, calendário e disponibilidade"
        icon={<ShieldCheck />}
        currentUser={session.user}
        backHref="/equipamentos"
        backLabel="Equipamentos"
        onRefresh={() => void refresh()}
        isRefreshing={isLoading}
        onLogout={logout}
      />

      <div className="mx-auto grid w-full max-w-[1720px] flex-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <PlatformSidebar
          title="Admin"
          items={navigationItems}
          activeId={activeSection}
          onSelect={(id) => setActiveSection(id as AdminSection)}
        />

        <main className="flex min-w-0 flex-col gap-6">
          {isLoading && allReservations.length === 0 ? (
            <InlineLoader label="Carregando reservas de equipamento..." />
          ) : null}

          <div key={activeSection} className="animate-fade-rise min-w-0">
            {activeSection === "dashboard" ? (
              <EquipmentAdminDashboard
                summary={summary}
                reservations={allReservations}
                onOpenRequest={openRequest}
                onSeeAllRequests={() => {
                  setRequestsFilter("Pendente");
                  setActiveSection("solicitacoes");
                }}
              />
            ) : null}

            {activeSection === "solicitacoes" ? (
              <EquipmentRequestsPanel
                // A chave remonta o painel quando o filtro inicial muda, para
                // a vinda do dashboard ja cair em "Pendentes".
                key={requestsFilter}
                reservations={allReservations}
                initialFilter={requestsFilter}
                onOpenRequest={openRequest}
              />
            ) : null}

            {activeSection === "calendario" ? (
              <EquipmentCalendar
                equipments={equipments}
                availability={availability}
                reservations={allReservations}
              />
            ) : null}

            {activeSection === "equipamentos" ? (
              <EquipmentInventoryPanel
                equipments={equipments}
                onChangeStatus={(equipmentId, status) => {
                  void changeEquipmentStatus(equipmentId, status);
                }}
              />
            ) : null}
          </div>
        </main>
      </div>

      <EquipmentReviewDialog
        open={Boolean(currentReview)}
        reservation={currentReview}
        onOpenChange={(open) => {
          if (!open) setReviewingReservation(undefined);
        }}
        onApprove={approveReservation}
        onReject={rejectReservation}
        onCancel={cancelReservation}
        onComplete={completeReservation}
      />
    </div>
  );
}

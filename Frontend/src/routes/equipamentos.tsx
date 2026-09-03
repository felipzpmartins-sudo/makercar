import { createFileRoute } from "@tanstack/react-router";
import { Bot, CalendarDays, ClipboardList, LayoutGrid, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, FullPageLoader, InlineLoader, Skeleton } from "@/components/LoadingStates";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { EquipmentCalendar } from "@/components/equipment/EquipmentCalendar";
import { EquipmentComingSoon } from "@/components/equipment/EquipmentComingSoon";
import { EquipmentDetails } from "@/components/equipment/EquipmentDetails";
import { EquipmentReservationModal } from "@/components/equipment/EquipmentReservationModal";
import { EquipmentReservationSuccess } from "@/components/equipment/EquipmentReservationSuccess";
import { EquipmentShowcase } from "@/components/equipment/EquipmentShowcase";
import { MyEquipmentReservations } from "@/components/equipment/MyEquipmentReservations";
import { Button } from "@/components/ui/button";
import type {
  EquipmentReservation,
  EquipmentReservationDraft,
  EquipmentTerms,
} from "@/data/equipment";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useEquipmentAccess } from "@/hooks/useEquipmentAccess";
import { useEquipmentState } from "@/hooks/useEquipmentState";
import { equipmentService } from "@/services/equipmentService";
import { canManageEquipmentRole } from "@/utils/roles";

type EquipmentSection = "catalogo" | "agenda" | "minhas";

export const Route = createFileRoute("/equipamentos")({
  head: () => ({
    meta: [
      { title: "MakerCar - Reserva de Equipamentos" },
      {
        name: "description",
        content: "Reserve equipamentos internos da MKR para apresentações, eventos e atividades.",
      },
    ],
  }),
  component: EquipamentosRoute,
});

function EquipamentosRoute() {
  const { session, isCheckingSession, logout } = useAuthSession({ redirectToLogin: true });
  const { needsPassword, isChecking: isCheckingAccess, markUnlocked } = useEquipmentAccess();
  const {
    equipments,
    myReservations,
    availability,
    isLoading,
    refresh,
    createReservation,
    cancelReservation,
  } = useEquipmentState();

  const [activeSection, setActiveSection] = useState<EquipmentSection>("catalogo");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<EquipmentReservation>();
  const [terms, setTerms] = useState<EquipmentTerms | null>(null);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);

  /*
   * O termo e buscado uma vez, na entrada da area, e nao na abertura do
   * formulario: assim o texto ja esta em maos quando a pessoa clica em
   * "Reservar", sem um segundo de espera no meio do fluxo.
   */
  useEffect(() => {
    let isActive = true;

    equipmentService
      .getTerms()
      .then((value) => {
        if (isActive) setTerms(value);
      })
      .catch(() => {
        // Sem o termo o envio fica bloqueado no formulario, que explica o
        // motivo. Nao ha o que fazer aqui alem de encerrar o carregamento.
      })
      .finally(() => {
        if (isActive) setIsLoadingTerms(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const selectedEquipment = useMemo(
    () => equipments.find((equipment) => equipment.id === selectedEquipmentId) ?? equipments[0],
    [equipments, selectedEquipmentId],
  );

  const selectedEquipmentPeriods = useMemo(
    () => availability.filter((period) => period.equipmentId === selectedEquipment?.id),
    [availability, selectedEquipment?.id],
  );

  const pendingCount = myReservations.filter(
    (reservation) => reservation.status === "Pendente",
  ).length;

  if (isCheckingSession || !session) {
    return <FullPageLoader label="Verificando seu acesso..." />;
  }

  if (session.user.mustChangePassword) {
    return <PasswordChangeRequired session={session} onLogout={logout} />;
  }

  // Cortina de lancamento: quem chega pela URL direta tambem passa por ela.
  if (isCheckingAccess) {
    return <FullPageLoader label="Verificando o acesso ao módulo..." />;
  }

  if (needsPassword) {
    return (
      <EquipmentComingSoon
        userName={session.user.name}
        onLogout={logout}
        onUnlocked={markUnlocked}
      />
    );
  }

  const isEquipmentAdmin = canManageEquipmentRole(session.user.role.name);

  const navigationItems = [
    {
      id: "catalogo",
      label: "Equipamentos",
      description: "Catálogo e reserva",
      icon: <LayoutGrid />,
    },
    {
      id: "agenda",
      label: "Agenda",
      description: "Disponibilidade do mês",
      icon: <CalendarDays />,
    },
    {
      id: "minhas",
      label: "Minhas reservas",
      description: pendingCount > 0 ? `${pendingCount} aguardando` : "Histórico e situação",
      icon: <ClipboardList />,
    },
    ...(isEquipmentAdmin
      ? [
          {
            id: "admin",
            href: "/equipamentos-admin",
            label: "Administração",
            description: "Aprovar e recusar",
            icon: <ShieldCheck />,
          },
        ]
      : []),
  ];

  async function handleConfirmReservation(draft: EquipmentReservationDraft) {
    const reservation = await createReservation(draft);
    if (!reservation) return false;

    setIsReservationModalOpen(false);
    setConfirmedReservation(reservation);
    return true;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ModuleHeader
        title="Equipamentos"
        subtitle="Reserva de equipamentos internos"
        icon={<Bot />}
        currentUser={session.user}
        backHref="/"
        onRefresh={() => void refresh()}
        isRefreshing={isLoading}
        onLogout={logout}
      />

      <div className="mx-auto grid w-full max-w-[1720px] flex-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <PlatformSidebar
          title="Equipamentos"
          items={navigationItems}
          activeId={activeSection}
          onSelect={(id) => setActiveSection(id as EquipmentSection)}
        />

        <main className="flex min-w-0 flex-col gap-8">
          <div key={activeSection} className="animate-fade-rise flex min-w-0 flex-col gap-8">
            {/* Primeira carga desenha a silhueta da vitrine; recarga com
                conteudo na tela mostra so uma faixa, para nao apagar o que a
                pessoa ja estava lendo. */}
            {isLoading && equipments.length === 0 ? (
              <ShowcaseSkeleton />
            ) : isLoading ? (
              <InlineLoader label="Atualizando equipamentos..." />
            ) : null}

            {activeSection === "catalogo" && !isLoading ? (
              selectedEquipment ? (
                <>
                  <EquipmentShowcase
                    equipments={equipments}
                    selectedEquipment={selectedEquipment}
                    onSelectEquipment={setSelectedEquipmentId}
                    onReserve={() => setIsReservationModalOpen(true)}
                  />
                  <EquipmentDetails
                    equipment={selectedEquipment}
                    onReserve={() => setIsReservationModalOpen(true)}
                  />
                </>
              ) : (
                <EmptyState
                  icon={<Bot />}
                  title="Nenhum equipamento disponível"
                  description="Não há equipamentos cadastrados no momento. Fale com o administrador do sistema."
                />
              )
            ) : null}

            {activeSection === "agenda" && !isLoading ? (
              equipments.length > 0 ? (
                <EquipmentCalendar equipments={equipments} availability={availability} />
              ) : (
                <EmptyState
                  icon={<CalendarDays />}
                  title="Sem equipamentos para exibir"
                  description="A agenda aparece assim que houver equipamentos cadastrados."
                />
              )
            ) : null}

            {activeSection === "minhas" ? (
              <MyEquipmentReservations
                reservations={myReservations}
                onCancel={(reservationId, reason) => {
                  void cancelReservation(reservationId, reason);
                }}
              />
            ) : null}
          </div>
        </main>
      </div>

      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1720px] flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 MakerCar - Equipamentos Internos</p>
          <Button asChild variant="link" className="h-auto p-0 text-sm">
            <a href="/">Voltar para a Central de Reservas</a>
          </Button>
        </div>
      </footer>

      {selectedEquipment ? (
        <EquipmentReservationModal
          open={isReservationModalOpen}
          equipment={selectedEquipment}
          currentUser={session.user}
          reservedPeriods={selectedEquipmentPeriods}
          terms={terms}
          isLoadingTerms={isLoadingTerms}
          onOpenChange={setIsReservationModalOpen}
          onConfirm={handleConfirmReservation}
        />
      ) : null}

      <EquipmentReservationSuccess
        open={Boolean(confirmedReservation)}
        reservation={confirmedReservation}
        onOpenChange={(open) => {
          if (!open) setConfirmedReservation(undefined);
        }}
        onViewReservations={() => setActiveSection("minhas")}
      />
    </div>
  );
}

/** Silhueta da vitrine, no mesmo formato do conteudo que vai substitui-la. */
function ShowcaseSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card"
      role="status"
      aria-label="Carregando equipamentos"
    >
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <Skeleton className="min-h-[300px] rounded-xl sm:min-h-[380px] lg:min-h-[440px]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-48 rounded-md" />
        </div>
      </div>
    </div>
  );
}

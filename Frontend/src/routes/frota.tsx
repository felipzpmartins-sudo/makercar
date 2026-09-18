import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Car, ClipboardList, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActiveReservations } from "@/components/ActiveReservations";
import { FleetSummary } from "@/components/FleetSummary";
import { EmptyState, FullPageLoader, InlineLoader, Skeleton } from "@/components/LoadingStates";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { PickupModal } from "@/components/PickupModal";
import { ReservationHistory } from "@/components/ReservationHistory";
import { ReservationCalendar } from "@/components/ReservationCalendar";
import { ReservationModal } from "@/components/ReservationModal";
import { ReturnModal } from "@/components/ReturnModal";
import { UserProfile } from "@/components/UserProfile";
import { VehicleShowcase } from "@/components/VehicleShowcase";
import { Button } from "@/components/ui/button";
import { isVehicleAvailable, type Reservation, type ReservationDraft } from "@/data/vehicles";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMakerCarState } from "@/hooks/useMakerCarState";
import { clearPickupInProgress, readPickupInProgress } from "@/utils/pickupDraft";
import { canAccessAdminRole } from "@/utils/roles";

type MainSection = "veiculos" | "agenda" | "resumo" | "reservas";

export const Route = createFileRoute("/frota")({
  head: () => ({
    meta: [
      { title: "MakerCar - Reserva de Veículos" },
      {
        name: "description",
        content: "Sistema interno da MKR para gerenciamento e reserva de veículos corporativos.",
      },
    ],
  }),
  component: FrotaRoute,
});

function FrotaRoute() {
  const { session, isCheckingSession, logout } = useAuthSession({ redirectToLogin: true });
  const {
    vehicles,
    reservations,
    reservationAvailability,
    isLoadingFleet,
    refreshFleet,
    createReservation,
    requestCancellation,
    registerPickup,
    registerReturn,
  } = useMakerCarState();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [activeSection, setActiveSection] = useState<MainSection>("veiculos");
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [pickupReservation, setPickupReservation] = useState<Reservation | undefined>();
  const [returnReservation, setReturnReservation] = useState<Reservation | undefined>();
  const hasResumedPickupRef = useRef(false);

  const canAccessAdmin = canAccessAdminRole(session?.user.role.name);

  /*
   * Sem escolha da pessoa, a vitrine abre num carro livre de uso geral: abrir
   * num carro em uso deixava o botao de reservar desabilitado logo na primeira
   * tela, e o carro do suporte pede uma senha que quase ninguem tem.
   */
  const selectedVehicle = useMemo(() => {
    return (
      vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ??
      vehicles.find((vehicle) => isVehicleAvailable(vehicle.status) && !vehicle.supportOnly) ??
      vehicles.find((vehicle) => isVehicleAvailable(vehicle.status)) ??
      vehicles[0]
    );
  }, [selectedVehicleId, vehicles]);

  const visibleReservations = useMemo(() => {
    // Compara por id: nomes podem se repetir entre colaboradores.
    return reservations.filter((reservation) => reservation.requesterId === session?.user.id);
  }, [reservations, session?.user.id]);

  const activeReservationCount = visibleReservations.filter((reservation) =>
    ["Pendente", "Reservado", "Em uso"].includes(reservation.status),
  ).length;

  const navigationItems = [
    {
      id: "veiculos",
      label: "Veículos",
      description: "Escolha e reserve",
      icon: <Car />,
    },
    {
      id: "agenda",
      label: "Agenda",
      description: "Reservas da semana",
      icon: <CalendarDays />,
    },
    {
      id: "reservas",
      label: "Minhas reservas",
      description:
        activeReservationCount > 0
          ? `${activeReservationCount} em andamento`
          : "Retirada e devolução",
      icon: <ClipboardList />,
    },
    ...(canAccessAdmin
      ? [
          {
            id: "resumo",
            label: "Resumo",
            description: "Indicadores",
            icon: <BarChart3 />,
          },
          {
            id: "admin",
            href: "/admin",
            label: "Administração",
            description: "Painel completo",
            icon: <ShieldCheck />,
          },
        ]
      : []),
  ];

  const selectedVehicleReservedPeriods = useMemo(
    () =>
      reservationAvailability.filter(
        (reservation) => reservation.vehicleId === selectedVehicle?.id,
      ),
    [reservationAvailability, selectedVehicle?.id],
  );

  /*
   * Retoma a retirada interrompida.
   *
   * No Android a camera costuma derrubar a WebView: o sistema mata o app para
   * liberar memoria e, na volta, a pagina recarrega na Central de Reservas.
   * Sem isto o motorista precisa refazer o caminho ate o checklist a cada foto
   * — foi o que travou a retirada na estrada. O rascunho e as fotos ja estao
   * guardados; aqui so reabrimos a tela onde ele parou.
   */
  useEffect(() => {
    // Sem sessao a lista visivel ainda esta vazia: decidir agora descartaria um
    // marcador valido.
    if (hasResumedPickupRef.current || !session || visibleReservations.length === 0) return;

    const pendingReservationId = readPickupInProgress();
    if (!pendingReservationId) return;

    hasResumedPickupRef.current = true;
    const pendingReservation = visibleReservations.find(
      (reservation) => reservation.id === pendingReservationId,
    );

    // Retirada ja concluida em outro aparelho ou reserva encerrada: nao ha o
    // que retomar, e o marcador so atrapalharia.
    if (!pendingReservation || pendingReservation.status !== "Reservado") {
      clearPickupInProgress();
      return;
    }

    setActiveSection("reservas");
    setPickupReservation(pendingReservation);
  }, [session, visibleReservations]);

  async function handleConfirmReservation(draft: ReservationDraft) {
    if (!selectedVehicle) return;
    if (await createReservation(selectedVehicle, draft)) {
      setIsReservationModalOpen(false);
    }
  }

  if (isCheckingSession || !session) {
    return <FullPageLoader label="Verificando seu acesso..." />;
  }

  if (session.user.mustChangePassword) {
    return <PasswordChangeRequired session={session} onLogout={logout} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ModuleHeader
        title="Reserva de Veículos"
        subtitle="Frota da MKR"
        icon={<Car />}
        currentUser={session.user}
        backHref="/"
        onRefresh={() => void refreshFleet()}
        isRefreshing={isLoadingFleet}
        onLogout={logout}
      />

      <div className="mx-auto grid w-full max-w-[1720px] flex-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <PlatformSidebar
          title="Frota"
          items={navigationItems}
          activeId={activeSection}
          onSelect={(id) => setActiveSection(id as MainSection)}
        />

        <main className="flex min-w-0 flex-col gap-8">
          <div key={activeSection} className="flex min-w-0 flex-col gap-8 animate-fade-rise">
            {/* Primeira carga: silhueta da vitrine. Recarga com dados na tela:
              apenas uma faixa, para nao apagar o que o usuario ja lia. */}
            {isLoadingFleet && vehicles.length === 0 ? (
              <ShowcaseSkeleton />
            ) : isLoadingFleet ? (
              <InlineLoader label="Atualizando dados da frota..." />
            ) : null}

            {activeSection === "veiculos" ? (
              <>
                {/* Quem tem carro para retirar ou devolver age antes de escolher outro. */}
                <ActiveReservations
                  reservations={visibleReservations}
                  onRegisterPickup={setPickupReservation}
                  onRegisterReturn={setReturnReservation}
                />
                {selectedVehicle ? (
                  <VehicleShowcase
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    availability={reservationAvailability}
                    onSelectVehicle={setSelectedVehicleId}
                    onReserve={() => setIsReservationModalOpen(true)}
                  />
                ) : !isLoadingFleet ? (
                  <EmptyState
                    icon={<Car />}
                    title="Nenhum veículo disponível"
                    description="Não há veículos cadastrados na frota no momento. Fale com o administrador do sistema."
                  />
                ) : null}
              </>
            ) : null}

            {activeSection === "agenda" ? (
              <ReservationCalendar reservations={reservations} />
            ) : null}

            {activeSection === "resumo" && canAccessAdmin ? (
              <FleetSummary vehicles={vehicles} />
            ) : null}

            {activeSection === "reservas" ? (
              <>
                {/* O historico vem primeiro: e nele que ficam retirada e devolucao. */}
                <ReservationHistory
                  reservations={visibleReservations}
                  showReason
                  canOperateReservations
                  onRequestCancellation={requestCancellation}
                  onRegisterPickup={setPickupReservation}
                  onRegisterReturn={setReturnReservation}
                />
                <UserProfile user={session.user} />
              </>
            ) : null}
          </div>
        </main>
      </div>

      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1720px] flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 MakerCar - Gestão de Frota Corporativa</p>
          <Button asChild variant="link" className="h-auto p-0 text-sm">
            <a href="/">Voltar para a Central de Reservas</a>
          </Button>
        </div>
      </footer>

      {selectedVehicle ? (
        <ReservationModal
          open={isReservationModalOpen}
          vehicle={selectedVehicle}
          currentUser={session.user}
          reservedPeriods={selectedVehicleReservedPeriods}
          onOpenChange={setIsReservationModalOpen}
          onConfirm={handleConfirmReservation}
        />
      ) : null}
      <PickupModal
        open={Boolean(pickupReservation)}
        reservation={pickupReservation}
        vehicles={vehicles}
        onOpenChange={(open) => {
          if (open) return;
          // Fechar o checklist e uma decisao do motorista: nao devemos reabri-lo
          // sozinho na proxima vez que o app carregar.
          clearPickupInProgress();
          setPickupReservation(undefined);
        }}
        onConfirm={async (draft) => {
          const success = await registerPickup(draft);
          if (success) setPickupReservation(undefined);
          return success;
        }}
      />
      <ReturnModal
        open={Boolean(returnReservation)}
        reservation={returnReservation}
        onOpenChange={(open) => {
          if (!open) setReturnReservation(undefined);
        }}
        onConfirm={(draft) => {
          void registerReturn(draft).then((success) => {
            if (success) setReturnReservation(undefined);
          });
        }}
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
      aria-label="Carregando veículos"
    >
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="min-h-[210px] w-full sm:min-h-[300px] lg:min-h-[380px]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-48 rounded-md" />
        </div>
      </div>
    </div>
  );
}

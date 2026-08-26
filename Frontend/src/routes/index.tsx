import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Car, LayoutDashboard, ShieldCheck, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { FleetSummary } from "@/components/FleetSummary";
import { Header } from "@/components/Header";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { PickupModal } from "@/components/PickupModal";
import { ReservationHistory } from "@/components/ReservationHistory";
import { ReservationCalendar } from "@/components/ReservationCalendar";
import { ReservationModal } from "@/components/ReservationModal";
import { ReturnModal } from "@/components/ReturnModal";
import { UserProfile } from "@/components/UserProfile";
import { VehicleDetails } from "@/components/VehicleDetails";
import { VehicleGrid } from "@/components/VehicleGrid";
import { VehicleHero } from "@/components/VehicleHero";
import { initialVehicles, type Reservation, type ReservationDraft } from "@/data/vehicles";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMakerCarState } from "@/hooks/useMakerCarState";
import { canAccessAdminRole } from "@/utils/roles";

type MainSection = "inicio" | "frota" | "reserva" | "agenda" | "resumo" | "perfil";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MakerCar - Reserva de Veículos" },
      {
        name: "description",
        content: "Sistema interno da MKR para gerenciamento e reserva de veículos corporativos.",
      },
    ],
  }),
  component: Index,
});

function Index() {
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
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicles[0].id);
  const [activeSection, setActiveSection] = useState<MainSection>("inicio");
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [pickupReservation, setPickupReservation] = useState<Reservation | undefined>();
  const [returnReservation, setReturnReservation] = useState<Reservation | undefined>();

  const canAccessAdmin = canAccessAdminRole(session?.user.role.name);
  const navigationItems = [
    {
      id: "inicio",
      label: "Inicio",
      description: "Veiculo em destaque",
      icon: <LayoutDashboard />,
    },
    {
      id: "frota",
      label: "Frota",
      description: "Escolha e reserve",
      icon: <Car />,
    },
    {
      id: "agenda",
      label: "Agenda",
      description: "Reservas da semana",
      icon: <CalendarDays />,
    },
    ...(canAccessAdmin
      ? [
          {
            id: "resumo",
            label: "Resumo",
            description: "Indicadores",
            icon: <BarChart3 />,
          },
        ]
      : []),
    {
      id: "perfil",
      label: "Perfil",
      description: "Dados da conta",
      icon: <UserCircle />,
    },
    ...(canAccessAdmin
      ? [
          {
            id: "admin",
            href: "/admin",
            label: "Admin",
            description: "Painel completo",
            icon: <ShieldCheck />,
          },
        ]
      : []),
  ];

  const selectedVehicle = useMemo(() => {
    return vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];
  }, [selectedVehicleId, vehicles]);

  const visibleReservations = useMemo(() => {
    // Compara por id: nomes podem se repetir entre colaboradores.
    return reservations.filter((reservation) => reservation.requesterId === session?.user.id);
  }, [reservations, session?.user.id]);

  const selectedVehicleReservedPeriods = useMemo(
    () =>
      reservationAvailability.filter((reservation) => reservation.vehicleId === selectedVehicle.id),
    [reservationAvailability, selectedVehicle.id],
  );

  async function handleConfirmReservation(draft: ReservationDraft) {
    if (await createReservation(selectedVehicle, draft)) {
      setIsReservationModalOpen(false);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        onNewReservation={() => {
          setActiveSection("frota");
        }}
        onAdminAccess={() => window.location.assign("/admin")}
        currentUser={session.user}
        canAccessAdmin={canAccessAdmin}
        onLogout={logout}
        onRefresh={() => void refreshFleet()}
        isRefreshing={isLoadingFleet}
      />

      <div className="mx-auto grid w-full max-w-[1720px] gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <PlatformSidebar
          title="Campos"
          items={navigationItems}
          activeId={activeSection === "reserva" ? "frota" : activeSection}
          onSelect={(id) => setActiveSection(id as MainSection)}
        />

        <main className="flex min-w-0 flex-col gap-10">
          {isLoadingFleet ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Carregando dados da frota...
            </div>
          ) : null}

          {activeSection === "inicio" ? <VehicleHero selectedVehicle={selectedVehicle} /> : null}

          {activeSection === "frota" ? (
            <VehicleGrid
              vehicles={vehicles}
              selectedVehicleId={selectedVehicle.id}
              onSelectVehicle={(vehicleId) => {
                setSelectedVehicleId(vehicleId);
                setActiveSection("reserva");
              }}
            />
          ) : null}

          {activeSection === "reserva" ? (
            <VehicleDetails
              vehicle={selectedVehicle}
              onReserve={() => setIsReservationModalOpen(true)}
            />
          ) : null}

          {activeSection === "agenda" ? <ReservationCalendar reservations={reservations} /> : null}

          {activeSection === "resumo" && canAccessAdmin ? (
            <FleetSummary vehicles={vehicles} />
          ) : null}

          {activeSection === "perfil" ? (
            <>
              <UserProfile user={session.user} />
              <ReservationHistory
                reservations={visibleReservations}
                showReason
                canOperateReservations
                onRequestCancellation={requestCancellation}
                onRegisterPickup={setPickupReservation}
                onRegisterReturn={setReturnReservation}
              />
            </>
          ) : null}
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1720px] flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 sm:flex-row lg:px-8">
          <p>© 2026 MakerCar - Gestão de Frota Corporativa</p>
          <p>Todos os veículos: Renault Kwid</p>
        </div>
      </footer>

      <ReservationModal
        open={isReservationModalOpen}
        vehicle={selectedVehicle}
        currentUser={session.user}
        reservedPeriods={selectedVehicleReservedPeriods}
        onOpenChange={setIsReservationModalOpen}
        onConfirm={handleConfirmReservation}
      />
      <PickupModal
        open={Boolean(pickupReservation)}
        reservation={pickupReservation}
        vehicles={vehicles}
        onOpenChange={(open) => {
          if (!open) setPickupReservation(undefined);
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

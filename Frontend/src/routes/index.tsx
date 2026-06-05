import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Car, ClipboardList, Gauge, LayoutDashboard, ShieldCheck, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { FleetSummary } from "@/components/FleetSummary";
import { Header } from "@/components/Header";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { PickupModal } from "@/components/PickupModal";
import { ReservationHistory } from "@/components/ReservationHistory";
import { ReservationModal } from "@/components/ReservationModal";
import { ReturnModal } from "@/components/ReturnModal";
import { UserProfile } from "@/components/UserProfile";
import { VehicleDetails } from "@/components/VehicleDetails";
import { VehicleGrid } from "@/components/VehicleGrid";
import { VehicleHero } from "@/components/VehicleHero";
import { initialVehicles, type Reservation, type ReservationDraft } from "@/data/vehicles";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMakerCarState } from "@/hooks/useMakerCarState";

type MainSection = "inicio" | "frota" | "reserva" | "resumo" | "perfil" | "historico";

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
    isLoadingFleet,
    createReservation,
    approveReservation,
    cancelReservation,
    registerPickup,
    registerReturn,
  } = useMakerCarState();
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicles[0].id);
  const [activeSection, setActiveSection] = useState<MainSection>("inicio");
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [pickupReservation, setPickupReservation] = useState<Reservation | undefined>();
  const [returnReservation, setReturnReservation] = useState<Reservation | undefined>();

  const canAccessAdmin = ["CEO", "Administrador"].includes(session?.user.role.name ?? "");
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
      description: "Lista de veiculos",
      icon: <Car />,
    },
    {
      id: "reserva",
      label: "Reserva",
      description: "Dados do veiculo",
      icon: <Gauge />,
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
    {
      id: "historico",
      label: "Historico",
      description: "Reservas",
      icon: <ClipboardList />,
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
    if (canAccessAdmin) return reservations;
    return reservations.filter((reservation) => reservation.requesterName === session?.user.name);
  }, [canAccessAdmin, reservations, session?.user.name]);

  const selectedVehicleUnavailableDates = useMemo(() => {
    return getUnavailableDatesForVehicle(reservations, selectedVehicle.id);
  }, [reservations, selectedVehicle.id]);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        onNewReservation={() => {
          setActiveSection("reserva");
          setIsReservationModalOpen(true);
        }}
        onAdminAccess={() => window.location.assign("/admin")}
        currentUser={session.user}
        canAccessAdmin={canAccessAdmin}
        onLogout={logout}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <PlatformSidebar
          title="Campos"
          items={navigationItems}
          activeId={activeSection}
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

          {activeSection === "resumo" && canAccessAdmin ? <FleetSummary vehicles={vehicles} /> : null}

          {activeSection === "perfil" ? <UserProfile user={session.user} /> : null}

          {activeSection === "historico" ? (
            <ReservationHistory
              reservations={visibleReservations}
              showReason
              canManageReservations={canAccessAdmin}
              onApproveReservation={approveReservation}
              onCancelReservation={cancelReservation}
              onRegisterPickup={setPickupReservation}
              onRegisterReturn={setReturnReservation}
            />
          ) : null}
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p>© 2026 MakerCar - Gestão de Frota Corporativa</p>
          <p>Todos os veículos: Renault Kwid</p>
        </div>
      </footer>

      <ReservationModal
        open={isReservationModalOpen}
        vehicle={selectedVehicle}
        currentUser={session.user}
        unavailableDates={selectedVehicleUnavailableDates}
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
        onConfirm={(draft) => {
          void registerPickup(draft).then((success) => {
            if (success) setPickupReservation(undefined);
          });
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

function getUnavailableDatesForVehicle(reservations: Reservation[], vehicleId: string) {
  const dates = new Set<string>();

  reservations.forEach((reservation) => {
    if (!["Pendente", "Reservado", "Em uso"].includes(reservation.status)) return;
    if (reservation.requestedVehicleId !== vehicleId && reservation.usedVehicleId !== vehicleId) {
      return;
    }

    eachDateInRange(reservation.pickupDate, reservation.returnDate).forEach((date) =>
      dates.add(date),
    );
  });

  return dates;
}

function eachDateInRange(start: string, end: string) {
  const dates: string[] = [];
  const current = parseDateValue(start);
  const finalDate = parseDateValue(end);

  while (current.getTime() <= finalDate.getTime()) {
    dates.push(formatDateValue(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

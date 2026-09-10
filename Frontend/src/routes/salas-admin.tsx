import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarDays, ClipboardList, DoorOpen, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { FullPageLoader, InlineLoader } from "@/components/LoadingStates";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { RoomAdminDashboard } from "@/components/rooms/RoomAdminDashboard";
import { RoomDayAgenda } from "@/components/rooms/RoomDayAgenda";
import { RoomInventoryPanel } from "@/components/rooms/RoomInventoryPanel";
import { RoomReservationsPanel } from "@/components/rooms/RoomReservationsPanel";
import { Button } from "@/components/ui/button";
import { todayValue } from "@/data/meetingRooms";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMeetingRoomState } from "@/hooks/useMeetingRoomState";
import { canManageRoomsRole } from "@/utils/roles";

type AdminSection = "dashboard" | "reservas" | "agenda" | "salas";

export const Route = createFileRoute("/salas-admin")({
  head: () => ({
    meta: [
      { title: "MakerCar - Administração de Salas" },
      {
        name: "description",
        content: "Painel de administração das salas de reunião da MKR.",
      },
    ],
  }),
  component: SalasAdminRoute,
});

function SalasAdminRoute() {
  const { session, isCheckingSession, logout } = useAuthSession({ redirectToLogin: true });
  const isRoomAdmin = canManageRoomsRole(session?.user.role.name);

  const {
    rooms,
    allReservations,
    availability,
    summary,
    isLoading,
    refresh,
    cancelReservation,
    changeRoomStatus,
  } = useMeetingRoomState({ withAdminData: isRoomAdmin });

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [agendaDate, setAgendaDate] = useState(todayValue);

  if (isCheckingSession || !session) {
    return <FullPageLoader label="Verificando seu acesso..." />;
  }

  if (session.user.mustChangePassword) {
    return <PasswordChangeRequired session={session} onLogout={logout} />;
  }

  if (!isRoomAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-foreground">Acesso administrativo restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta não possui permissão para administrar as salas de reunião.
          </p>
          <Button asChild className="mt-5">
            <a href="/salas">Voltar para as salas</a>
          </Button>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: summary?.today ? `${summary.today} reuniões hoje` : "Indicadores",
      icon: <BarChart3 />,
    },
    {
      id: "reservas",
      label: "Reservas",
      description: "Consultar e cancelar",
      icon: <ClipboardList />,
    },
    {
      id: "agenda",
      label: "Agenda do dia",
      description: "Ocupação por sala",
      icon: <CalendarDays />,
    },
    {
      id: "salas",
      label: "Salas",
      description: "Disponibilidade",
      icon: <DoorOpen />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ModuleHeader
        title="Administração de Salas"
        subtitle="Reservas, agenda e disponibilidade"
        icon={<ShieldCheck />}
        currentUser={session.user}
        backHref="/salas"
        backLabel="Salas"
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
            <InlineLoader label="Carregando reservas de sala..." />
          ) : null}

          <div key={activeSection} className="animate-fade-rise min-w-0">
            {activeSection === "dashboard" ? (
              <RoomAdminDashboard
                summary={summary}
                reservations={allReservations}
                onSeeAllReservations={() => setActiveSection("reservas")}
              />
            ) : null}

            {activeSection === "reservas" ? (
              <RoomReservationsPanel
                reservations={allReservations}
                onCancel={(reservationId, reason) => {
                  void cancelReservation(reservationId, reason);
                }}
              />
            ) : null}

            {activeSection === "agenda" ? (
              <div className="space-y-6">
                {rooms.map((room) => (
                  <RoomDayAgenda
                    key={room.id}
                    room={room}
                    availability={availability}
                    date={agendaDate}
                    currentUserId={session.user.id}
                    onChangeDate={setAgendaDate}
                    // Sem onReserveSlot a agenda fica em modo de consulta: quem
                    // administra vê a ocupação e reserva pela tela normal, como
                    // qualquer pessoa.
                  />
                ))}
              </div>
            ) : null}

            {activeSection === "salas" ? (
              <RoomInventoryPanel
                rooms={rooms}
                onChangeStatus={(roomId, status) => {
                  void changeRoomStatus(roomId, status);
                }}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

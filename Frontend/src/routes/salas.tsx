import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, DoorOpen, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, InlineLoader, Skeleton, FullPageLoader } from "@/components/LoadingStates";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { MyRoomReservations } from "@/components/rooms/MyRoomReservations";
import { RoomDayAgenda } from "@/components/rooms/RoomDayAgenda";
import { RoomReservationModal } from "@/components/rooms/RoomReservationModal";
import { RoomShowcase } from "@/components/rooms/RoomShowcase";
import { Button } from "@/components/ui/button";
import { todayValue, type MeetingRoomReservationDraft } from "@/data/meetingRooms";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMeetingRoomState } from "@/hooks/useMeetingRoomState";
import { canManageRoomsRole } from "@/utils/roles";
import { toast } from "sonner";

type RoomSection = "salas" | "agenda" | "minhas";

export const Route = createFileRoute("/salas")({
  head: () => ({
    meta: [
      { title: "MakerCar - Reserva de Salas de Reunião" },
      {
        name: "description",
        content: "Reserve as salas de reunião da MKR por horário, sem passar por aprovação.",
      },
    ],
  }),
  component: SalasRoute,
});

function SalasRoute() {
  const { session, isCheckingSession, logout } = useAuthSession({ redirectToLogin: true });
  const {
    rooms,
    myReservations,
    availability,
    isLoading,
    refresh,
    createReservation,
    cancelReservation,
  } = useMeetingRoomState();

  const [activeSection, setActiveSection] = useState<RoomSection>("salas");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [agendaDate, setAgendaDate] = useState(todayValue);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  /* Horário escolhido ao clicar num vão livre — vazio quando abre pelo botão. */
  const [pickedSlot, setPickedSlot] = useState<{ startTime: string; endTime: string }>();

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId],
  );

  const selectedRoomPeriods = useMemo(
    () => availability.filter((period) => period.roomId === selectedRoom?.id),
    [availability, selectedRoom?.id],
  );

  const todayCount = myReservations.filter(
    (reservation) => reservation.date === todayValue() && reservation.status === "Confirmada",
  ).length;

  if (isCheckingSession || !session) {
    return <FullPageLoader label="Verificando seu acesso..." />;
  }

  if (session.user.mustChangePassword) {
    return <PasswordChangeRequired session={session} onLogout={logout} />;
  }

  const isRoomAdmin = canManageRoomsRole(session.user.role.name);

  const navigationItems = [
    {
      id: "salas",
      label: "Salas",
      description: "Fotos e recursos",
      icon: <DoorOpen />,
    },
    {
      id: "agenda",
      label: "Agenda do dia",
      description: "Horários livres",
      icon: <CalendarDays />,
    },
    {
      id: "minhas",
      label: "Minhas reservas",
      description: todayCount > 0 ? `${todayCount} hoje` : "Histórico e situação",
      icon: <ClipboardList />,
    },
    ...(isRoomAdmin
      ? [
          {
            id: "admin",
            href: "/salas-admin",
            label: "Administração",
            description: "Reservas e salas",
            icon: <ShieldCheck />,
          },
        ]
      : []),
  ];

  function openReservationModal(slot?: { startTime: string; endTime: string }) {
    setPickedSlot(slot);
    setIsReservationModalOpen(true);
  }

  async function handleConfirmReservation(draft: MeetingRoomReservationDraft) {
    const reservation = await createReservation(draft);
    if (!reservation) return false;

    /*
     * Sem tela de sucesso: a reserva de sala ja nasce confirmada, entao o
     * retorno util e ver o bloco aparecendo na agenda do dia reservado. Um
     * modal de "deu certo" so somaria um clique.
     */
    toast.success(
      `${reservation.roomName} reservada — ${reservation.startTime} às ${reservation.endTime}.`,
    );
    setAgendaDate(reservation.date);
    setActiveSection("agenda");
    return true;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ModuleHeader
        title="Salas de Reunião"
        subtitle="Reserva por horário"
        icon={<DoorOpen />}
        currentUser={session.user}
        backHref="/"
        onRefresh={() => void refresh()}
        isRefreshing={isLoading}
        onLogout={logout}
      />

      <div className="mx-auto grid w-full max-w-[1720px] flex-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <PlatformSidebar
          title="Salas"
          items={navigationItems}
          activeId={activeSection}
          onSelect={(id) => setActiveSection(id as RoomSection)}
        />

        <main className="flex min-w-0 flex-col gap-8">
          <div key={activeSection} className="animate-fade-rise flex min-w-0 flex-col gap-8">
            {/* Primeira carga desenha a silhueta da vitrine; recarga com
                conteudo na tela mostra so uma faixa, para nao apagar o que a
                pessoa ja estava lendo. */}
            {isLoading && rooms.length === 0 ? (
              <ShowcaseSkeleton />
            ) : isLoading ? (
              <InlineLoader label="Atualizando salas..." />
            ) : null}

            {activeSection === "salas" && !isLoading ? (
              selectedRoom ? (
                <>
                  <RoomShowcase
                    rooms={rooms}
                    selectedRoom={selectedRoom}
                    onSelectRoom={setSelectedRoomId}
                    onReserve={() => openReservationModal()}
                  />
                  {/* A agenda de hoje logo abaixo da vitrine: a pergunta que
                      vem depois de "que sala e essa?" e sempre "esta livre?". */}
                  <RoomDayAgenda
                    room={selectedRoom}
                    availability={availability}
                    date={agendaDate}
                    currentUserId={session.user.id}
                    onChangeDate={setAgendaDate}
                    onReserveSlot={(startTime, endTime) =>
                      openReservationModal({ startTime, endTime })
                    }
                  />
                </>
              ) : (
                <EmptyState
                  icon={<DoorOpen />}
                  title="Nenhuma sala cadastrada"
                  description="Não há salas de reunião cadastradas no momento. Fale com o administrador do sistema."
                />
              )
            ) : null}

            {activeSection === "agenda" && !isLoading ? (
              selectedRoom ? (
                <div className="space-y-6">
                  {/* Uma agenda por sala, empilhadas: com duas salas, comparar
                      lado a lado e mais rapido do que trocar de aba. */}
                  {rooms.map((room) => (
                    <RoomDayAgenda
                      key={room.id}
                      room={room}
                      availability={availability}
                      date={agendaDate}
                      currentUserId={session.user.id}
                      onChangeDate={setAgendaDate}
                      onReserveSlot={(startTime, endTime) => {
                        setSelectedRoomId(room.id);
                        openReservationModal({ startTime, endTime });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarDays />}
                  title="Sem salas para exibir"
                  description="A agenda aparece assim que houver salas cadastradas."
                />
              )
            ) : null}

            {activeSection === "minhas" ? (
              <MyRoomReservations
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
          <p>© 2026 MakerCar - Salas de Reunião</p>
          <Button asChild variant="link" className="h-auto p-0 text-sm">
            <a href="/">Voltar para a Central de Reservas</a>
          </Button>
        </div>
      </footer>

      {selectedRoom ? (
        <RoomReservationModal
          open={isReservationModalOpen}
          room={selectedRoom}
          reservedPeriods={selectedRoomPeriods}
          initialDate={agendaDate}
          initialStartTime={pickedSlot?.startTime}
          initialEndTime={pickedSlot?.endTime}
          onOpenChange={setIsReservationModalOpen}
          onConfirm={handleConfirmReservation}
        />
      ) : null}
    </div>
  );
}

/** Silhueta da vitrine, no mesmo formato do conteudo que vai substitui-la. */
function ShowcaseSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card"
      role="status"
      aria-label="Carregando salas"
    >
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="aspect-[3/2] w-full rounded-none lg:aspect-auto lg:min-h-[420px]" />
        <div className="space-y-4 p-5 sm:p-7">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-48 rounded-md" />
        </div>
      </div>
    </div>
  );
}

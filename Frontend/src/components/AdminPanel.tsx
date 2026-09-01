import {
  Ban,
  BarChart3,
  Car,
  ClipboardCheck,
  ClipboardList,
  Crown,
  ExternalLink,
  IdCard,
  KeyRound,
  ArrowRightLeft,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  CnhPreviewDialog,
  statusLabel as cnhStatusLabel,
  type CnhPreviewTarget,
} from "@/components/CnhPreviewDialog";
import { EmptyState, TableSkeleton } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getVehicleStatusLabel,
  getVehicleStatusStyle,
  reservationStatusStyles,
  type Reservation,
  type ReservationStatus,
  type Vehicle,
  type VehicleStatus,
} from "@/data/vehicles";
import { adminService } from "@/services/adminService";
import { openProtectedMedia } from "@/services/apiClient";
import { reservationService, type TransferCandidate } from "@/services/reservationService";
import type { AdminRole, AdminUser } from "@/services/userService";
import { vehicleService } from "@/services/vehicleService";
import { isSupremeOwnerRole } from "@/utils/roles";

interface AdminPanelProps {
  isAdmin: boolean;
  activeSection: AdminSection;
  vehicles: Vehicle[];
  reservations: Reservation[];
  users: AdminUser[];
  roles: AdminRole[];
  isLoadingUsers: boolean;
  canReviewCnh: boolean;
  canManageUsers: boolean;
  canUseOwnerTools: boolean;
  currentUserId: string;
  onChangeUserRole: (userId: string, roleId: string) => void;
  onChangeCnhStatus: (userId: string, status: "PENDING" | "APPROVED" | "REJECTED") => void;
  onDeleteUser: (userId: string) => void;
  onResetUserPassword: (userId: string, password: string) => Promise<boolean> | boolean | void;
  onChangeVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  onChangeVehicleSupportOnly: (vehicleId: string, supportOnly: boolean) => void;
  onUpdateVehicleMileage: (vehicleId: string, mileage: number) => Promise<boolean> | boolean | void;
  onResetVehicleMileage: (vehicleId: string) => Promise<boolean> | boolean | void;
  onCancelReservation: (
    reservationId: string,
    reason?: string,
  ) => Promise<boolean> | boolean | void;
  onTransferReservation: (
    reservationId: string,
    userId: string,
  ) => Promise<boolean> | boolean | void;
  onApproveReservation: (reservationId: string) => Promise<boolean> | boolean | void;
  onChangeReservationVehicle: (
    reservationId: string,
    vehicleId: string,
  ) => Promise<boolean> | boolean | void;
  onRejectReservation: (reservationId: string, reason: string) => Promise<boolean> | boolean | void;
  onDeleteReservationHistory: (reservationId: string) => Promise<boolean> | boolean | void;
  onRequestAccess: () => void;
}

export type AdminSection =
  "dashboard" | "usuarios" | "veiculos" | "historicoVeiculos" | "historicoGeral";

const reservationStatuses: Array<ReservationStatus | "Todos"> = [
  "Todos",
  "Pendente",
  "Reservado",
  "Recusada",
  "Em uso",
  "Finalizada",
  "Cancelada",
];

const reservationGroups = [
  "Todos",
  "Pendentes de aprovacao",
  "Reservadas",
  "Recusadas",
  "Em andamento",
  "Solicitacoes de cancelamento",
  "Finalizadas",
  "Canceladas",
] as const;

type ChecklistPreview = {
  title: string;
  reservation: Reservation;
  notes?: string;
  photoUrl?: string | null;
  performedBy?: {
    name: string;
    email: string;
  };
  kmLabel: string;
  kmValue?: number;
  dateLabel: string;
  dateValue: string;
};

export function AdminPanel({
  isAdmin,
  activeSection,
  vehicles,
  reservations,
  users,
  roles,
  isLoadingUsers,
  canReviewCnh,
  canManageUsers,
  canUseOwnerTools,
  currentUserId,
  onChangeUserRole,
  onChangeCnhStatus,
  onDeleteUser,
  onResetUserPassword,
  onChangeVehicleStatus,
  onChangeVehicleSupportOnly,
  onUpdateVehicleMileage,
  onResetVehicleMileage,
  onCancelReservation,
  onTransferReservation,
  onApproveReservation,
  onChangeReservationVehicle,
  onRejectReservation,
  onDeleteReservationHistory,
  onRequestAccess,
}: AdminPanelProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id ?? "");
  const [vehicleFilter, setVehicleFilter] = useState("Todos");
  const [userFilter, setUserFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "Todos">("Todos");
  const [statusGroupFilter, setStatusGroupFilter] = useState<
    | "Todos"
    | "Pendentes de aprovacao"
    | "Reservadas"
    | "Recusadas"
    | "Em andamento"
    | "Solicitacoes de cancelamento"
    | "Finalizadas"
    | "Canceladas"
  >("Todos");
  const [periodFilter, setPeriodFilter] = useState("");
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [auditReservation, setAuditReservation] = useState<Reservation | null>(null);
  const [rejectionReservation, setRejectionReservation] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancelReservation, setCancelReservation] = useState<Reservation | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [vehicleChangeReservation, setVehicleChangeReservation] = useState<Reservation | null>(
    null,
  );
  const [replacementVehicleId, setReplacementVehicleId] = useState("");
  const [transferReservation, setTransferReservation] = useState<Reservation | null>(null);
  const [transferUserId, setTransferUserId] = useState("");
  const [transferCandidates, setTransferCandidates] = useState<TransferCandidate[]>([]);

  const summary = adminService.getSummary(vehicles, reservations);
  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];
  const vehicleHistory = selectedVehicle
    ? vehicleService.getVehicleHistory(selectedVehicle, reservations)
    : [];

  useEffect(() => {
    if (!selectedVehicleId && vehicles[0]) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [selectedVehicleId, vehicles]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(reservations.map((reservation) => reservation.department).filter(Boolean)),
      ),
    [reservations],
  );

  const filteredReservations = reservations.filter((reservation) => {
    const matchesVehicle =
      vehicleFilter === "Todos" ||
      String(reservation.requestedVehicleId) === vehicleFilter ||
      String(reservation.usedVehicleId) === vehicleFilter;
    const matchesUser =
      !userFilter ||
      reservation.requesterName.toLowerCase().includes(userFilter.toLowerCase()) ||
      reservation.requesterEmail?.toLowerCase().includes(userFilter.toLowerCase());
    const matchesDepartment = !departmentFilter || reservation.department === departmentFilter;
    const matchesStatus = statusFilter === "Todos" || reservation.status === statusFilter;
    const matchesGroup =
      statusGroupFilter === "Todos" ||
      (statusGroupFilter === "Pendentes de aprovacao" && reservation.status === "Pendente") ||
      (statusGroupFilter === "Reservadas" && reservation.status === "Reservado") ||
      (statusGroupFilter === "Recusadas" && reservation.status === "Recusada") ||
      (statusGroupFilter === "Em andamento" &&
        ["Pendente", "Reservado", "Em uso"].includes(reservation.status)) ||
      (statusGroupFilter === "Solicitacoes de cancelamento" &&
        Boolean(reservation.cancellationRequestedAt) &&
        !["Cancelada", "Finalizada"].includes(reservation.status)) ||
      (statusGroupFilter === "Finalizadas" && reservation.status === "Finalizada") ||
      (statusGroupFilter === "Canceladas" && reservation.status === "Cancelada");
    const matchesPeriod = !periodFilter || reservation.pickupDate === periodFilter;
    return (
      matchesVehicle &&
      matchesUser &&
      matchesDepartment &&
      matchesStatus &&
      matchesGroup &&
      matchesPeriod
    );
  });

  const handleRejectReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rejectionReservation || !rejectionReason.trim()) return;

    const success = await onRejectReservation(rejectionReservation.id, rejectionReason.trim());
    if (success !== false) {
      setRejectionReservation(null);
      setRejectionReason("");
    }
  };

  const handleCancelReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancelReservation) return;

    const success = await onCancelReservation(
      cancelReservation.id,
      cancellationReason.trim() || undefined,
    );
    if (success !== false) {
      setCancelReservation(null);
      setCancellationReason("");
    }
  };

  const handleChangeReservationVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vehicleChangeReservation || !replacementVehicleId) return;

    const success = await onChangeReservationVehicle(
      vehicleChangeReservation.id,
      replacementVehicleId,
    );
    if (success !== false) {
      setVehicleChangeReservation(null);
      setReplacementVehicleId("");
    }
  };

  const handleTransferReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!transferReservation || !transferUserId) return;

    const success = await onTransferReservation(transferReservation.id, transferUserId);
    if (success !== false) {
      setTransferReservation(null);
      setTransferUserId("");
    }
  };

  useEffect(() => {
    if (!transferReservation) return;

    void reservationService
      .listTransferCandidates()
      .then(setTransferCandidates)
      .catch(() => setTransferCandidates([]));
  }, [transferReservation]);

  if (!isAdmin) {
    return (
      <section
        id="administracao"
        className="scroll-mt-24 rounded-lg border border-border bg-card p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-subtle text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-foreground">Área Administrativa</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          O painel administrativo fica protegido por senha e mostra motivos, histórico completo e
          gestão manual da frota.
        </p>
        <Button type="button" onClick={onRequestAccess} className="mt-5">
          Acessar Administração
        </Button>
      </section>
    );
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordUser || newPassword.length < 8) return;

    const success = await onResetUserPassword(passwordUser.id, newPassword);
    if (success !== false) {
      setPasswordUser(null);
      setNewPassword("");
    }
  }

  return (
    <>
      <section id="administracao" className="scroll-mt-24 space-y-8">
        {activeSection === "dashboard" ? (
          <div
            id="admin-dashboard"
            className="scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Dashboard Administrativo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Indicadores operacionais da frota MKR.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <AdminCard label="Total de veículos" value={summary.totalVehicles} />
              <AdminCard label="Disponíveis" value={summary.available} />
              <AdminCard label="Reservados" value={summary.reserved} />
              <AdminCard label="Em uso" value={summary.inUse} />
              <AdminCard label="Em manutenção" value={summary.maintenance} />
              <AdminCard label="Indisponíveis" value={summary.unavailable} />
              <AdminCard label="Reservas do dia" value={summary.todayReservations} />
              <AdminCard label="Reservas ativas" value={summary.activeReservations} />
              <AdminCard label="Finalizadas" value={summary.finishedReservations} />
            </div>
          </div>
        ) : null}

        {activeSection === "usuarios" && canReviewCnh ? (
          <div
            id="admin-usuarios"
            className="scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  Usuários cadastrados
                </h3>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
                {users.length} {users.length === 1 ? "usuário" : "usuários"}
              </span>
            </div>
            <AdminUsersTable
              users={users}
              roles={roles}
              currentUserId={currentUserId}
              isLoading={isLoadingUsers}
              canManageUsers={canManageUsers}
              onChangeUserRole={onChangeUserRole}
              onChangeCnhStatus={onChangeCnhStatus}
              onDeleteUser={onDeleteUser}
              onOpenPasswordReset={(user) => {
                setPasswordUser(user);
                setNewPassword("");
              }}
            />
          </div>
        ) : null}

        {activeSection === "veiculos" ? (
          <div
            id="admin-veiculos"
            className="scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
              <Car className="h-5 w-5 text-primary" />
              Gestão de veículos
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acesso</TableHead>
                  <TableHead>KM atual</TableHead>
                  <TableHead>Último usuário</TableHead>
                  <TableHead>Última utilização</TableHead>
                  <TableHead>Última devolução</TableHead>
                  <TableHead>Alterar status</TableHead>
                  {canUseOwnerTools ? <TableHead>Ferramentas</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const statusLabel = getVehicleStatusLabel(vehicle.status);
                  const statusStyle = getVehicleStatusStyle(vehicle.status);

                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.name}</TableCell>
                      <TableCell className="font-mono text-xs">{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.color}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1 text-center text-xs font-medium leading-none ${statusStyle}`}
                          title={statusLabel}
                        >
                          <span className="truncate">{statusLabel}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <label className="flex items-center gap-2 text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(vehicle.supportOnly)}
                            onChange={(event) =>
                              onChangeVehicleSupportOnly(vehicle.id, event.target.checked)
                            }
                            className="h-4 w-4 rounded border-border-strong"
                          />
                          Exclusivo do suporte
                        </label>
                      </TableCell>
                      <TableCell>
                        <MileageEditor
                          vehicle={vehicle}
                          onSave={(mileage) => onUpdateVehicleMileage(vehicle.id, mileage)}
                        />
                      </TableCell>
                      <TableCell>{vehicle.lastUser ?? "-"}</TableCell>
                      <TableCell>{vehicle.lastPickup ?? vehicle.lastReservation ?? "-"}</TableCell>
                      <TableCell>{vehicle.lastReturn ?? "-"}</TableCell>
                      <TableCell>
                        <NativeSelect
                          value={vehicle.status}
                          onChange={(event) =>
                            onChangeVehicleStatus(vehicle.id, event.target.value as VehicleStatus)
                          }
                          className="min-w-36"
                        >
                          <option value={"Dispon\u00edvel"}>Disponível</option>
                          <option value="Reservado">Reservado</option>
                          <option value="Em uso">Em uso</option>
                          <option value={"Em manuten\u00e7\u00e3o"}>Em manutenção</option>
                          <option value={"Indispon\u00edvel"}>Indisponível</option>
                        </NativeSelect>
                      </TableCell>
                      {canUseOwnerTools ? (
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Zerar o KM do veiculo ${vehicle.plate}? Esta acao deve ser usada apenas em testes.`,
                                )
                              ) {
                                void onResetVehicleMileage(vehicle.id);
                              }
                            }}
                            className="text-primary hover:bg-primary-subtle"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Zerar KM
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}

        {activeSection === "historicoVeiculos" ? (
          <div
            id="admin-historico-veiculos"
            className="scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              Histórico dos veículos
            </h3>
            <div className="mb-4 max-w-sm">
              <NativeSelect
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                className="w-full"
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <AdminHistoryTable
              reservations={vehicleHistory}
              vehicles={vehicles}
              canUseOwnerTools={canUseOwnerTools}
              onRequestCancelReservation={(reservation) => {
                setCancelReservation(reservation);
                setCancellationReason("");
              }}
              onRequestTransferReservation={setTransferReservation}
              onApproveReservation={onApproveReservation}
              onRequestAuditReservation={(reservation) => setAuditReservation(reservation)}
              onRequestRejectReservation={(reservation) => {
                setRejectionReservation(reservation);
                setRejectionReason("");
              }}
              onRequestVehicleChange={(reservation) => {
                setVehicleChangeReservation(reservation);
                setReplacementVehicleId("");
              }}
              onDeleteReservationHistory={onDeleteReservationHistory}
            />
          </div>
        ) : null}

        {activeSection === "historicoGeral" ? (
          <div
            id="admin-historico-geral"
            className="scroll-mt-24 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-foreground">Histórico geral</h3>
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
                {filteredReservations.length} registros
              </span>
            </div>
            <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <Input
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                placeholder="Filtrar por usuário"
                className="h-10"
              />
              <NativeSelect
                value={vehicleFilter}
                onChange={(event) => setVehicleFilter(event.target.value)}
              >
                <option>Todos</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option value="">Todos os departamentos</option>
                {departments.map((department) => (
                  <option key={department}>{department}</option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={statusGroupFilter}
                onChange={(event) =>
                  setStatusGroupFilter(event.target.value as typeof statusGroupFilter)
                }
              >
                {reservationGroups.map((statusGroup) => (
                  <option key={statusGroup}>{statusGroup}</option>
                ))}
              </NativeSelect>
              <input
                type="date"
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value)}
              />
              <NativeSelect
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ReservationStatus | "Todos")
                }
              >
                {reservationStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="overflow-x-auto">
              <AdminHistoryTable
                reservations={filteredReservations}
                vehicles={vehicles}
                canUseOwnerTools={canUseOwnerTools}
                onRequestCancelReservation={(reservation) => {
                  setCancelReservation(reservation);
                  setCancellationReason("");
                }}
                onRequestTransferReservation={setTransferReservation}
                onApproveReservation={onApproveReservation}
                onRequestAuditReservation={(reservation) => setAuditReservation(reservation)}
                onRequestRejectReservation={(reservation) => {
                  setRejectionReservation(reservation);
                  setRejectionReason("");
                }}
                onRequestVehicleChange={(reservation) => {
                  setVehicleChangeReservation(reservation);
                  setReplacementVehicleId("");
                }}
                onDeleteReservationHistory={onDeleteReservationHistory}
              />
            </div>
          </div>
        ) : null}
      </section>
      <Dialog
        open={Boolean(passwordUser)}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordUser(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Defina uma senha temporaria para {passwordUser?.name} - {passwordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Senha temporaria"
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordUser(null);
                  setNewPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <KeyRound className="h-4 w-4" />
                Salvar senha temporaria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(vehicleChangeReservation)}
        onOpenChange={(open) => {
          if (!open) {
            setVehicleChangeReservation(null);
            setReplacementVehicleId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar veículo da reserva</DialogTitle>
            <DialogDescription>
              A reserva de {vehicleChangeReservation?.requesterName} mantera as mesmas datas e o
              mesmo motivo. O sistema validara conflitos antes de salvar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeReservationVehicle} className="space-y-4">
            <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
              Atual: <span className="font-medium">{vehicleChangeReservation?.plate}</span>
            </div>
            <NativeSelect
              value={replacementVehicleId}
              onChange={(event) => setReplacementVehicleId(event.target.value)}
              className="w-full"
              required
            >
              <option value="">Selecione o veiculo substituto</option>
              {vehicles
                .filter(
                  (vehicle) =>
                    vehicle.id !== vehicleChangeReservation?.requestedVehicleId &&
                    !["Em manuten\u00e7\u00e3o", "Indispon\u00edvel"].includes(vehicle.status),
                )
                .map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name} ({vehicle.status})
                  </option>
                ))}
            </NativeSelect>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setVehicleChangeReservation(null);
                  setReplacementVehicleId("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <ArrowRightLeft className="h-4 w-4" />
                Confirmar troca
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(transferReservation)}
        onOpenChange={(open) => {
          if (!open) {
            setTransferReservation(null);
            setTransferUserId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transferir titularidade</DialogTitle>
            <DialogDescription>
              Transfira a reserva do veiculo {transferReservation?.plate} para outra pessoa com CNH
              aprovada e valida. Essa acao so esta disponivel antes da retirada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransferReservation} className="space-y-4">
            <div className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
              Titular atual:{" "}
              <span className="font-medium">{transferReservation?.requesterName}</span>
            </div>
            <NativeSelect
              value={transferUserId}
              onChange={(event) => setTransferUserId(event.target.value)}
              className="w-full"
              required
            >
              <option value="">Selecione a nova titular</option>
              {transferCandidates
                .filter((candidate) => candidate.id !== transferReservation?.requesterId)
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} - {candidate.department.name}
                  </option>
                ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              São exibidas apenas pessoas ativas com CNH aprovada e dentro da validade.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTransferReservation(null);
                  setTransferUserId("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <ArrowRightLeft className="h-4 w-4" />
                Transferir reserva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(rejectionReservation)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectionReservation(null);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar reserva</DialogTitle>
            <DialogDescription>
              Informe o motivo para {rejectionReservation?.requesterName} -{" "}
              {rejectionReservation?.plate}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectReservation} className="space-y-4">
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Motivo da recusa"
              minLength={3}
              required
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectionReservation(null);
                  setRejectionReason("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <XCircle className="h-4 w-4" />
                Recusar reserva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(cancelReservation)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelReservation(null);
            setCancellationReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              Reserva de {cancelReservation?.requesterName} - {cancelReservation?.plate}. A
              observacao e opcional e ficara registrada no historico.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCancelReservation} className="space-y-4">
            {cancelReservation?.cancellationRequestReason ? (
              <div className="rounded-md border border-warning/25 bg-warning-subtle p-3 text-sm text-warning-subtle-foreground">
                <p className="font-medium">Motivo informado pelo solicitante</p>
                <p>{cancelReservation.cancellationRequestReason}</p>
              </div>
            ) : null}
            <textarea
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              placeholder="Observacao sobre o cancelamento (opcional)"
              maxLength={1000}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCancelReservation(null);
                  setCancellationReason("");
                }}
              >
                Voltar
              </Button>
              <Button type="submit">
                <Ban className="h-4 w-4" />
                Confirmar cancelamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ReservationAuditDialog
        reservation={auditReservation}
        onOpenChange={(open) => {
          if (!open) setAuditReservation(null);
        }}
      />
    </>
  );
}

function MileageEditor({
  vehicle,
  onSave,
}: {
  vehicle: Vehicle;
  onSave: (mileage: number) => Promise<boolean> | boolean | void;
}) {
  const [mileage, setMileage] = useState(String(vehicle.km));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMileage(String(vehicle.km));
  }, [vehicle.km]);

  const parsedMileage = Number(mileage);
  const hasValidMileage = Number.isInteger(parsedMileage) && parsedMileage >= vehicle.km;
  const hasChanged = parsedMileage !== vehicle.km;

  async function saveMileage() {
    if (!hasValidMileage || !hasChanged) return;
    setIsSaving(true);
    try {
      await onSave(parsedMileage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-w-40 items-center gap-2">
      <Input
        type="number"
        min={vehicle.km}
        step={1}
        value={mileage}
        onChange={(event) => setMileage(event.target.value)}
        aria-label={`KM atual do veiculo ${vehicle.plate}`}
        className="h-9 w-28"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasValidMileage || !hasChanged || isSaving}
        onClick={() => void saveMileage()}
      >
        {isSaving ? "Salvando" : "Salvar"}
      </Button>
    </div>
  );
}

function AdminUsersTable({
  users,
  roles,
  currentUserId,
  isLoading,
  canManageUsers,
  onChangeUserRole,
  onChangeCnhStatus,
  onDeleteUser,
  onOpenPasswordReset,
}: {
  users: AdminUser[];
  roles: AdminRole[];
  currentUserId: string;
  isLoading: boolean;
  canManageUsers: boolean;
  onChangeUserRole: (userId: string, roleId: string) => void;
  onChangeCnhStatus: (userId: string, status: "PENDING" | "APPROVED" | "REJECTED") => void;
  onDeleteUser: (userId: string) => void;
  onOpenPasswordReset: (user: AdminUser) => void;
}) {
  // Declarado antes dos early returns: a ordem dos hooks precisa ser estavel.
  const [cnhPreview, setCnhPreview] = useState<CnhPreviewTarget | null>(null);

  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="Nenhum usuário cadastrado"
        description="As contas criadas no sistema aparecerão aqui."
      />
    );
  }

  const manageableRoles = roles.filter((role) =>
    ["Administrador", "CEO", "Colaborador"].includes(role.name),
  );

  return (
    <>
      <CnhPreviewDialog
        target={cnhPreview}
        canReview={canManageUsers}
        onOpenChange={(open) => {
          if (!open) setCnhPreview(null);
        }}
        onChangeStatus={onChangeCnhStatus}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>CNH</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.department.name}</TableCell>
              <TableCell>
                {!canManageUsers || isSupremeOwnerRole(user.role.name) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-subtle px-2.5 py-1 text-xs font-semibold text-warning-subtle-foreground ring-1 ring-warning/20">
                    <Crown className="h-3.5 w-3.5" />
                    {user.role.name}
                  </span>
                ) : (
                  <NativeSelect
                    value={user.role.id}
                    onChange={(event) => onChangeUserRole(user.id, event.target.value)}
                    className="min-w-40"
                  >
                    {manageableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name === "Colaborador" ? "Usuario" : role.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    user.active
                      ? "bg-success-subtle text-success-subtle-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.active ? "Ativo" : "Inativo"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex min-w-48 flex-col items-start gap-1.5">
                  {user.cnhNumber ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {user.cnhNumber}
                    </span>
                  ) : null}

                  {user.cnhPhotoUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCnhPreview({
                          userId: user.id,
                          name: user.name,
                          cnhNumber: user.cnhNumber,
                          cnhExpiresAt: user.cnhExpiresAt,
                          cnhStatus: user.cnhStatus,
                          photoUrl: user.cnhPhotoUrl as string,
                        })
                      }
                    >
                      <IdCard className="h-3.5 w-3.5" />
                      Ver CNH
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-subtle px-2.5 py-1 text-xs font-medium text-neutral-subtle-foreground ring-1 ring-border-strong">
                      Não enviada
                    </span>
                  )}

                  {user.cnhNumber ? (
                    <NativeSelect
                      value={user.cnhStatus ?? "PENDING"}
                      aria-label={`Situação da CNH de ${user.name}`}
                      onChange={(event) =>
                        onChangeCnhStatus(
                          user.id,
                          event.target.value as "PENDING" | "APPROVED" | "REJECTED",
                        )
                      }
                      sizeVariant="sm"
                      className="w-full"
                    >
                      <option value="PENDING">Em análise</option>
                      <option value="APPROVED">Aprovada</option>
                      <option value="REJECTED">Recusada</option>
                    </NativeSelect>
                  ) : (
                    <span className="text-xs text-muted-foreground">{cnhStatusLabel(null)}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                {canManageUsers ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenPasswordReset(user)}
                      title="Redefinir senha"
                    >
                      <KeyRound className="h-4 w-4" />
                      Senha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteUser(user.id)}
                      disabled={user.id === currentUserId || isSupremeOwnerRole(user.role.name)}
                      className="text-danger-subtle-foreground hover:text-danger-subtle-foreground"
                      title={
                        user.id === currentUserId
                          ? "Sua conta principal nao pode ser excluida"
                          : "Excluir usuario"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function AdminCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-border-strong">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function AdminHistoryTable({
  reservations,
  vehicles,
  canUseOwnerTools,
  onRequestCancelReservation,
  onRequestTransferReservation,
  onApproveReservation,
  onRequestAuditReservation,
  onRequestRejectReservation,
  onRequestVehicleChange,
  onDeleteReservationHistory,
}: {
  reservations: Reservation[];
  vehicles: Vehicle[];
  canUseOwnerTools: boolean;
  onRequestCancelReservation: (reservation: Reservation) => void;
  onRequestTransferReservation: (reservation: Reservation) => void;
  onApproveReservation: (reservationId: string) => Promise<boolean> | boolean | void;
  onRequestAuditReservation: (reservation: Reservation) => void;
  onRequestRejectReservation: (reservation: Reservation) => void;
  onRequestVehicleChange: (reservation: Reservation) => void;
  onDeleteReservationHistory: (reservationId: string) => Promise<boolean> | boolean | void;
}) {
  const [checklistPreview, setChecklistPreview] = useState<ChecklistPreview | null>(null);

  if (reservations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-muted p-6 text-center text-sm text-muted-foreground">
        Nenhum registro encontrado.
      </div>
    );
  }

  return (
    <>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Solicitante</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Reserva</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Checklist</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => {
            const usedVehicle = vehicles.find(
              (vehicle) => vehicle.id === reservation.usedVehicleId,
            );
            const canCancel = ["Pendente", "Reservado", "Em uso"].includes(reservation.status);
            const canApprove = reservation.status === "Pendente";
            const canReject = reservation.status === "Pendente";
            const canChangeVehicle = ["Pendente", "Reservado"].includes(reservation.status);
            const canTransfer = reservation.status === "Reservado";
            return (
              <TableRow key={reservation.id}>
                <TableCell className="break-words">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{reservation.requesterName}</p>
                    <p className="text-xs text-muted-foreground">
                      {reservation.requesterEmail ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">{reservation.department}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      CNH: {reservation.requesterCnhNumber ?? "-"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {reservation.requesterCnhStatus ?? "PENDING"}
                      </span>
                      <PhotoLink
                        href={reservation.requesterCnhPhotoUrl ?? undefined}
                        label="Ver CNH"
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="break-words">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{reservation.vehicleName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{reservation.plate}</p>
                    <p className="text-xs text-muted-foreground">
                      Usado: {usedVehicle?.plate ?? reservation.usedVehicleId ?? "-"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="break-words">
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">{reservation.reason}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Retirada:</span>{" "}
                        {formatDateTime(reservation.pickupDate, reservation.pickupTime)}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Devolução:</span>{" "}
                        {formatDateTime(reservation.returnDate, reservation.returnTime)}
                      </p>
                    </div>
                    {reservation.rejectionReason ? (
                      <p className="text-xs font-medium text-danger-subtle-foreground">
                        Recusa: {reservation.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="break-words">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${reservationStatusStyles[reservation.status]}`}
                    >
                      {reservation.status}
                    </span>
                    <p>
                      <span className="font-medium text-foreground">Responsável:</span>{" "}
                      {reservation.reviewedByName ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Revisado em:</span>{" "}
                      {reservation.reviewedAt ? formatDate(reservation.reviewedAt) : "-"}
                    </p>
                    {reservation.rejectionReason ? (
                      <p className="text-danger-subtle-foreground">
                        <span className="font-medium">Motivo:</span> {reservation.rejectionReason}
                      </p>
                    ) : null}
                    {reservation.cancellationRequestedAt ? (
                      <div className="rounded-md border border-warning/25 bg-warning-subtle p-2 text-warning-subtle-foreground">
                        <p className="font-medium">Cancelamento solicitado</p>
                        <p>{reservation.cancellationRequestReason ?? "Sem motivo informado."}</p>
                      </div>
                    ) : null}
                    {reservation.cancellationReason ? (
                      <div className="rounded-md border border-danger/25 bg-danger-subtle p-2 text-danger-subtle-foreground">
                        <p className="font-medium">Observacao do cancelamento</p>
                        <p>{reservation.cancellationReason}</p>
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="break-words">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">Retirada</p>
                      <p>KM: {reservation.pickup?.kmStart ?? "-"}</p>
                      <p>Combustível: {reservation.pickup?.fuelLevel || "-"}</p>
                      <PhotoLink href={reservation.pickup?.photoUrl} label="Foto" />
                    </div>
                    <ChecklistButton
                      disabled={!reservation.pickup?.notes}
                      label="Checklist retirada"
                      onClick={() =>
                        setChecklistPreview({
                          title: "Checklist de retirada",
                          reservation,
                          notes: reservation.pickup?.notes,
                          photoUrl: reservation.pickup?.photoUrl,
                          performedBy: reservation.pickup?.createdBy
                            ? {
                                name: reservation.pickup.createdBy.name,
                                email: reservation.pickup.createdBy.email,
                              }
                            : undefined,
                          kmLabel: "KM inicial",
                          kmValue: reservation.pickup?.kmStart,
                          dateLabel: "Retirada",
                          dateValue: formatDateTime(
                            reservation.pickup?.date ?? "",
                            reservation.pickup?.time ?? "",
                          ),
                        })
                      }
                    />
                    <div>
                      <p className="font-medium text-foreground">Devolução</p>
                      <p>KM: {reservation.return?.kmEnd ?? "-"}</p>
                      <p>Combustível: {reservation.return?.fuelLevel || "-"}</p>
                      <PhotoLink href={reservation.return?.photoUrl} label="Foto" />
                    </div>
                    <ChecklistButton
                      disabled={!reservation.return?.notes}
                      label="Checklist devolução"
                      onClick={() =>
                        setChecklistPreview({
                          title: "Checklist de devolução",
                          reservation,
                          notes: reservation.return?.notes,
                          photoUrl: reservation.return?.photoUrl,
                          performedBy: reservation.return?.createdBy
                            ? {
                                name: reservation.return.createdBy.name,
                                email: reservation.return.createdBy.email,
                              }
                            : undefined,
                          kmLabel: "KM final",
                          kmValue: reservation.return?.kmEnd,
                          dateLabel: "Devolução",
                          dateValue: formatDateTime(
                            reservation.return?.date ?? "",
                            reservation.return?.time ?? "",
                          ),
                        })
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {canCancel || canUseOwnerTools ? (
                    <div className="flex min-w-[9.5rem] flex-wrap items-start gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRequestAuditReservation(reservation)}
                        className="text-primary hover:text-primary-subtle-foreground"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Auditoria
                      </Button>
                      {canApprove ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void onApproveReservation(reservation.id)}
                          className="text-success-subtle-foreground hover:text-success-subtle-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar
                        </Button>
                      ) : null}
                      {canReject ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRequestRejectReservation(reservation)}
                          className="text-danger-subtle-foreground hover:text-danger-subtle-foreground"
                        >
                          <XCircle className="h-4 w-4" />
                          Recusar
                        </Button>
                      ) : null}
                      {canChangeVehicle ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRequestVehicleChange(reservation)}
                          className="text-primary hover:text-primary-subtle-foreground"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Trocar veículo
                        </Button>
                      ) : null}
                      {canTransfer ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRequestTransferReservation(reservation)}
                          className="text-primary-subtle-foreground hover:text-primary-subtle-foreground"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Transferir titular
                        </Button>
                      ) : null}
                      {canCancel ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRequestCancelReservation(reservation)}
                          className="text-danger-subtle-foreground hover:text-danger-subtle-foreground"
                        >
                          <Ban className="h-4 w-4" />
                          Cancelar
                        </Button>
                      ) : null}
                      {canUseOwnerTools ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Excluir definitivamente este historico de ${reservation.plate}? Esta acao nao pode ser desfeita.`,
                              )
                            ) {
                              void onDeleteReservationHistory(reservation.id);
                            }
                          }}
                          className="text-danger-subtle-foreground hover:text-danger-subtle-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ChecklistPreviewDialog
        preview={checklistPreview}
        onOpenChange={(open) => {
          if (!open) setChecklistPreview(null);
        }}
      />
    </>
  );
}

function formatDateTime(date: string, time: string) {
  if (!date || !time) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time}`;
}

function ChecklistButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  if (disabled) return <span className="text-xs text-muted-foreground">-</span>;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 whitespace-nowrap px-2 text-xs text-primary hover:bg-primary-subtle"
    >
      <ClipboardCheck className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

function ChecklistPreviewDialog({
  preview,
  onOpenChange,
}: {
  preview: ChecklistPreview | null;
  onOpenChange: (open: boolean) => void;
}) {
  const parsed = parseChecklistNotes(preview?.notes);

  return (
    <Dialog open={Boolean(preview)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{preview?.title ?? "Checklist"}</DialogTitle>
          <DialogDescription>
            {preview ? `${preview.reservation.requesterName} - ${preview.reservation.plate}` : ""}
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-lg border border-border bg-muted p-4 text-sm sm:grid-cols-2">
              <InfoItem label="Solicitante" value={preview.reservation.requesterName} />
              <InfoItem label="Departamento" value={preview.reservation.department} />
              <InfoItem label={preview.dateLabel} value={preview.dateValue} />
              <InfoItem
                label={preview.kmLabel}
                value={
                  preview.kmValue !== undefined
                    ? `${preview.kmValue.toLocaleString("pt-BR")} km`
                    : "-"
                }
              />
              <InfoItem
                label="Responsável"
                value={preview.performedBy ? preview.performedBy.name : "-"}
              />
              <InfoItem
                label="E-mail"
                value={preview.performedBy ? preview.performedBy.email : "-"}
              />
            </div>

            {parsed.items.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Itens conferidos</h4>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {parsed.items.map((item) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[1fr_auto]"
                    >
                      <span className="text-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Observações</h4>
              <div className="min-h-16 whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm text-foreground">
                {parsed.observations || "Sem observações."}
              </div>
            </div>

            {preview.photoUrl ? (
              <div className="flex justify-end">
                <PhotoLink href={preview.photoUrl} label="Abrir foto do checklist" />
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ReservationAuditDialog({
  reservation,
  onOpenChange,
}: {
  reservation: Reservation | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(reservation)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Auditoria da reserva</DialogTitle>
          <DialogDescription>
            {reservation ? `${reservation.requesterName} - ${reservation.plate}` : ""}
          </DialogDescription>
        </DialogHeader>

        {reservation ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-lg border border-border bg-muted p-4 text-sm sm:grid-cols-2">
              <InfoItem label="Solicitante" value={reservation.requesterName} />
              <InfoItem label="E-mail" value={reservation.requesterEmail ?? "-"} />
              <InfoItem
                label="Veículo"
                value={`${reservation.vehicleName} - ${reservation.plate}`}
              />
              <InfoItem label="Status" value={reservation.status} />
              <InfoItem label="Revisado por" value={reservation.reviewedByName ?? "-"} />
              <InfoItem
                label="Revisado em"
                value={reservation.reviewedAt ? formatDate(reservation.reviewedAt) : "-"}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Solicitação original</h4>
              <div className="grid gap-3 rounded-lg border border-border p-4 text-sm sm:grid-cols-2">
                <InfoItem label="Departamento" value={reservation.department} />
                <InfoItem label="Motivo" value={reservation.reason} />
                <InfoItem
                  label="Retirada prevista"
                  value={formatDateTime(reservation.pickupDate, reservation.pickupTime)}
                />
                <InfoItem
                  label="Devolução prevista"
                  value={formatDateTime(reservation.returnDate, reservation.returnTime)}
                />
                <InfoItem label="CNH" value={reservation.requesterCnhNumber ?? "-"} />
                <InfoItem label="CNH status" value={reservation.requesterCnhStatus ?? "-"} />
              </div>
            </div>

            {reservation.rejectionReason ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Recusa</h4>
                <div className="rounded-lg border border-danger/25 bg-danger-subtle p-4 text-sm text-danger-subtle-foreground">
                  {reservation.rejectionReason}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Checklist e ações</h4>
              <div className="divide-y divide-border rounded-lg border border-border">
                {(reservation.logs ?? []).length > 0 ? (
                  reservation.logs!.map((log) => (
                    <div
                      key={log.id}
                      className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-medium text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.user.name} - {log.user.email}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Sem eventos de auditoria.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Retirada</h4>
                <div className="rounded-lg border border-border p-4 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium text-foreground">Data:</span>{" "}
                    {formatDateTime(reservation.pickup?.date ?? "", reservation.pickup?.time ?? "")}
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium text-foreground">KM:</span>{" "}
                    {reservation.pickup?.kmStart ?? "-"}
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium text-foreground">Responsável:</span>{" "}
                    {reservation.pickup?.createdBy?.name ?? "-"}
                  </p>
                  <PhotoLink href={reservation.pickup?.photoUrl} label="Foto retirada" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Devolução</h4>
                <div className="rounded-lg border border-border p-4 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium text-foreground">Data:</span>{" "}
                    {formatDateTime(reservation.return?.date ?? "", reservation.return?.time ?? "")}
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium text-foreground">KM:</span>{" "}
                    {reservation.return?.kmEnd ?? "-"}
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium text-foreground">Responsável:</span>{" "}
                    {reservation.return?.createdBy?.name ?? "-"}
                  </p>
                  <PhotoLink href={reservation.return?.photoUrl} label="Foto devolução" />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function parseChecklistNotes(notes?: string) {
  if (!notes?.trim()) return { items: [], observations: "" };

  const lines = notes.split(/\r?\n/);
  const items: Array<{ label: string; value: string }> = [];
  const observationIndex = lines.findIndex((line) =>
    line.trim().toLowerCase().startsWith("observa"),
  );
  const checklistLines = observationIndex >= 0 ? lines.slice(0, observationIndex) : lines;
  const observationLines = observationIndex >= 0 ? lines.slice(observationIndex + 1) : [];

  for (const line of checklistLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) continue;
    const content = trimmed.slice(2);
    const separatorIndex = content.indexOf(":");
    if (separatorIndex === -1) continue;
    items.push({
      label: content.slice(0, separatorIndex).trim(),
      value: content.slice(separatorIndex + 1).trim() || "-",
    });
  }

  const observations = observationLines.join("\n").trim();
  return {
    items,
    observations: observations || (items.length === 0 ? notes.trim() : ""),
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function PhotoLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) return <span className="text-xs text-muted-foreground">-</span>;

  return (
    <button
      type="button"
      onClick={() => {
        void openProtectedMedia(href).catch((error) => {
          window.alert(error instanceof Error ? error.message : "Não foi possível abrir a foto.");
        });
      }}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-primary hover:bg-primary-subtle"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

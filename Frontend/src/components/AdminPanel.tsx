import {
  Ban,
  BarChart3,
  Car,
  ClipboardCheck,
  ClipboardList,
  Crown,
  ExternalLink,
  KeyRound,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

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
  canManageUsers: boolean;
  canUseOwnerTools: boolean;
  currentUserId: string;
  onChangeUserRole: (userId: string, roleId: string) => void;
  onChangeCnhStatus: (userId: string, status: "PENDING" | "APPROVED" | "REJECTED") => void;
  onDeleteUser: (userId: string) => void;
  onResetUserPassword: (userId: string, password: string) => Promise<boolean> | boolean | void;
  onChangeVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  onResetVehicleMileage: (vehicleId: string) => Promise<boolean> | boolean | void;
  onCancelReservation: (reservationId: string) => void;
  onApproveReservation: (reservationId: string) => Promise<boolean> | boolean | void;
  onRejectReservation: (reservationId: string, reason: string) => Promise<boolean> | boolean | void;
  onDeleteReservationHistory: (reservationId: string) => Promise<boolean> | boolean | void;
  onRequestAccess: () => void;
}

export type AdminSection =
  | "dashboard"
  | "usuarios"
  | "veiculos"
  | "historicoVeiculos"
  | "historicoGeral";

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
  "Aprovadas",
  "Recusadas",
  "Em andamento",
  "Finalizadas",
  "Canceladas",
] as const;

type ChecklistPreview = {
  title: string;
  reservation: Reservation;
  notes?: string;
  photoUrl?: string;
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
  canManageUsers,
  canUseOwnerTools,
  currentUserId,
  onChangeUserRole,
  onChangeCnhStatus,
  onDeleteUser,
  onResetUserPassword,
  onChangeVehicleStatus,
  onResetVehicleMileage,
  onCancelReservation,
  onApproveReservation,
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
    "Todos" | "Aprovadas" | "Recusadas" | "Em andamento" | "Finalizadas" | "Canceladas"
  >("Todos");
  const [periodFilter, setPeriodFilter] = useState("");
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [auditReservation, setAuditReservation] = useState<Reservation | null>(null);
  const [rejectionReservation, setRejectionReservation] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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
      (statusGroupFilter === "Aprovadas" && reservation.status === "Reservado") ||
      (statusGroupFilter === "Recusadas" && reservation.status === "Recusada") ||
      (statusGroupFilter === "Em andamento" &&
        ["Pendente", "Reservado", "Em uso"].includes(reservation.status)) ||
      (statusGroupFilter === "Finalizadas" && reservation.status === "Finalizada") ||
      (statusGroupFilter === "Canceladas" && reservation.status === "Cancelada");
    const matchesPeriod = !periodFilter || reservation.pickupDate === periodFilter;
    return matchesVehicle && matchesUser && matchesDepartment && matchesStatus && matchesGroup && matchesPeriod;
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

  if (!isAdmin) {
    return (
      <section
        id="administracao"
        className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-950">Área Administrativa</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          O painel administrativo fica protegido por senha e mostra motivos, histórico completo e
          gestão manual da frota.
        </p>
        <Button
          type="button"
          onClick={onRequestAccess}
          className="mt-5 bg-blue-600 text-white hover:bg-blue-700"
        >
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
            className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Dashboard Administrativo
              </h2>
              <p className="mt-1 text-sm text-slate-600">Indicadores operacionais da frota MKR.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {activeSection === "usuarios" && canManageUsers ? (
          <div
            id="admin-usuarios"
            className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                  <Users className="h-5 w-5 text-blue-600" />
                  Usuarios cadastrados
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {users.length} {users.length === 1 ? "usuario" : "usuarios"}
              </span>
            </div>
            <AdminUsersTable
              users={users}
              roles={roles}
              currentUserId={currentUserId}
              isLoading={isLoadingUsers}
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
            className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-950">
              <Car className="h-5 w-5 text-blue-600" />
              Gestão de veículos
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Status</TableHead>
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
                      <TableCell>{vehicle.km.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell>{vehicle.lastUser ?? "-"}</TableCell>
                      <TableCell>{vehicle.lastPickup ?? vehicle.lastReservation ?? "-"}</TableCell>
                      <TableCell>{vehicle.lastReturn ?? "-"}</TableCell>
                      <TableCell>
                        <select
                          value={vehicle.status}
                          onChange={(event) =>
                            onChangeVehicleStatus(vehicle.id, event.target.value as VehicleStatus)
                          }
                          className="h-9 min-w-36 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value={"Dispon\u00edvel"}>Disponível</option>
                          <option value="Reservado">Reservado</option>
                          <option value="Em uso">Em uso</option>
                          <option value={"Em manuten\u00e7\u00e3o"}>Em manutenção</option>
                          <option value={"Indispon\u00edvel"}>Indisponível</option>
                        </select>
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
                            className="text-blue-700 hover:bg-blue-50"
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
            className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-950">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Histórico dos veículos
            </h3>
            <div className="mb-4 max-w-sm">
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name}
                  </option>
                ))}
              </select>
            </div>
            <AdminHistoryTable
              reservations={vehicleHistory}
              vehicles={vehicles}
              canUseOwnerTools={canUseOwnerTools}
              onCancelReservation={onCancelReservation}
              onApproveReservation={onApproveReservation}
              onDeleteReservationHistory={onDeleteReservationHistory}
            />
          </div>
        ) : null}

        {activeSection === "historicoGeral" ? (
          <div
            id="admin-historico-geral"
            className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-950">Histórico geral</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {filteredReservations.length} registros
              </span>
            </div>
            <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <Input
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                placeholder="Filtrar por usuario"
                className="h-10"
              />
              <select
                value={vehicleFilter}
                onChange={(event) => setVehicleFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Todos</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name}
                  </option>
                ))}
              </select>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos departamentos</option>
                {departments.map((department) => (
                  <option key={department}>{department}</option>
                ))}
              </select>
              <select
                value={statusGroupFilter}
                onChange={(event) => setStatusGroupFilter(event.target.value as typeof statusGroupFilter)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {reservationGroups.map((statusGroup) => (
                  <option key={statusGroup}>{statusGroup}</option>
                ))}
              </select>
              <input
                type="date"
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ReservationStatus | "Todos")
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {reservationStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <AdminHistoryTable
                reservations={filteredReservations}
                vehicles={vehicles}
                canUseOwnerTools={canUseOwnerTools}
                onCancelReservation={onCancelReservation}
                onApproveReservation={onApproveReservation}
                onRequestAuditReservation={(reservation) => setAuditReservation(reservation)}
                onRequestRejectReservation={(reservation) => {
                  setRejectionReservation(reservation);
                  setRejectionReason("");
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
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                <KeyRound className="h-4 w-4" />
                Salvar senha temporaria
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
              <Button type="submit" className="bg-rose-600 text-white hover:bg-rose-700">
                <XCircle className="h-4 w-4" />
                Recusar reserva
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

function AdminUsersTable({
  users,
  roles,
  currentUserId,
  isLoading,
  onChangeUserRole,
  onChangeCnhStatus,
  onDeleteUser,
  onOpenPasswordReset,
}: {
  users: AdminUser[];
  roles: AdminRole[];
  currentUserId: string;
  isLoading: boolean;
  onChangeUserRole: (userId: string, roleId: string) => void;
  onChangeCnhStatus: (userId: string, status: "PENDING" | "APPROVED" | "REJECTED") => void;
  onDeleteUser: (userId: string) => void;
  onOpenPasswordReset: (user: AdminUser) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Carregando usuarios...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Nenhum usuario cadastrado.
      </div>
    );
  }

  const manageableRoles = roles.filter((role) =>
    ["Administrador", "CEO", "Colaborador"].includes(role.name),
  );

  return (
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
          <TableHead>Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.department.name}</TableCell>
            <TableCell>
              {isSupremeOwnerRole(user.role.name) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                  <Crown className="h-3.5 w-3.5" />
                  {user.role.name}
                </span>
              ) : (
                <select
                  value={user.role.id}
                  onChange={(event) => onChangeUserRole(user.id, event.target.value)}
                  className="h-9 min-w-40 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {manageableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name === "Colaborador" ? "Usuario" : role.name}
                    </option>
                  ))}
                </select>
              )}
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  user.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {user.active ? "Ativo" : "Inativo"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex min-w-44 flex-col gap-2">
                {user.cnhPhotoUrl ? (
                  <a
                    href={user.cnhPhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Ver documento
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">Nao enviada</span>
                )}
                {user.cnhNumber ? (
                  <select
                    value={user.cnhStatus ?? "PENDING"}
                    onChange={(event) =>
                      onChangeCnhStatus(
                        user.id,
                        event.target.value as "PENDING" | "APPROVED" | "REJECTED",
                      )
                    }
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="PENDING">Em analise</option>
                    <option value="APPROVED">Aprovada</option>
                    <option value="REJECTED">Recusada</option>
                  </select>
                ) : null}
              </div>
            </TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>
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
                  className="text-red-700 hover:text-red-800"
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AdminCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function AdminHistoryTable({
  reservations,
  vehicles,
  canUseOwnerTools,
  onCancelReservation,
  onApproveReservation,
  onRequestAuditReservation,
  onRequestRejectReservation,
  onDeleteReservationHistory,
}: {
  reservations: Reservation[];
  vehicles: Vehicle[];
  canUseOwnerTools: boolean;
  onCancelReservation: (reservationId: string) => void;
  onApproveReservation: (reservationId: string) => Promise<boolean> | boolean | void;
  onRequestAuditReservation: (reservation: Reservation) => void;
  onRequestRejectReservation: (reservation: Reservation) => void;
  onDeleteReservationHistory: (reservationId: string) => Promise<boolean> | boolean | void;
}) {
  const [checklistPreview, setChecklistPreview] = useState<ChecklistPreview | null>(null);

  if (reservations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Nenhum registro encontrado.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Solicitante</TableHead>
            <TableHead>CNH</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Retirada</TableHead>
            <TableHead>Devolução</TableHead>
            <TableHead>Revisão</TableHead>
            <TableHead>KM inicial</TableHead>
            <TableHead>KM final</TableHead>
            <TableHead>Foto retirada</TableHead>
            <TableHead>Foto devolução</TableHead>
            <TableHead>Checklist retirada</TableHead>
            <TableHead>Checklist devolução</TableHead>
            <TableHead>Status</TableHead>
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
            return (
              <TableRow key={reservation.id}>
                <TableCell className="min-w-52">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-950">{reservation.requesterName}</p>
                    <p className="text-xs text-slate-500">{reservation.requesterEmail ?? "-"}</p>
                    <p className="text-xs text-slate-500">{reservation.department}</p>
                  </div>
                </TableCell>
                <TableCell className="min-w-40">
                  <div className="space-y-1">
                    <p className="font-mono text-xs font-medium text-slate-950">
                      {reservation.requesterCnhNumber ?? "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {reservation.requesterCnhStatus ?? "PENDING"}
                    </p>
                    <PhotoLink
                      href={reservation.requesterCnhPhotoUrl ?? undefined}
                      label="Ver CNH"
                    />
                  </div>
                </TableCell>
                <TableCell className="min-w-48">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-950">{reservation.vehicleName}</p>
                    <p className="font-mono text-xs text-slate-500">{reservation.plate}</p>
                    <p className="text-xs text-slate-500">
                      Usado: {usedVehicle?.plate ?? reservation.usedVehicleId ?? "-"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-700">{reservation.reason}</p>
                    {reservation.rejectionReason ? (
                      <p className="text-xs font-medium text-rose-700">
                        Recusa: {reservation.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="min-w-40">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-slate-950">
                      {formatDateTime(reservation.pickupDate, reservation.pickupTime)}
                    </p>
                    <p className="text-xs text-slate-500">Previsto para retirada</p>
                  </div>
                </TableCell>
                <TableCell className="min-w-40">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-slate-950">
                      {formatDateTime(reservation.returnDate, reservation.returnTime)}
                    </p>
                    <p className="text-xs text-slate-500">Previsto para devolução</p>
                  </div>
                </TableCell>
                <TableCell className="min-w-48">
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>
                      <span className="font-medium text-slate-900">Responsável:</span>{" "}
                      {reservation.reviewedByName ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Revisado em:</span>{" "}
                      {reservation.reviewedAt ? formatDate(reservation.reviewedAt) : "-"}
                    </p>
                    {reservation.rejectionReason ? (
                      <p className="text-rose-700">
                        <span className="font-medium">Motivo:</span> {reservation.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>{reservation.pickup?.kmStart ?? "-"}</p>
                    <p>{reservation.pickup?.fuelLevel || "-"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>{reservation.return?.kmEnd ?? "-"}</p>
                    <p>{reservation.return?.fuelLevel || "-"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <PhotoLink href={reservation.pickup?.photoUrl} label="Retirada" />
                </TableCell>
                <TableCell>
                  <PhotoLink href={reservation.return?.photoUrl} label="Devolução" />
                </TableCell>
                <TableCell>
                  <ChecklistButton
                    disabled={!reservation.pickup?.notes}
                    label="Retirada"
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
                </TableCell>
                <TableCell>
                  <ChecklistButton
                    disabled={!reservation.return?.notes}
                    label="Devolução"
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
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${reservationStatusStyles[reservation.status]}`}
                  >
                    {reservation.status}
                  </span>
                </TableCell>
                <TableCell>
                  {canCancel || canUseOwnerTools ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRequestAuditReservation(reservation)}
                        className="text-blue-700 hover:text-blue-800"
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
                          className="text-emerald-700 hover:text-emerald-800"
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
                          className="text-rose-700 hover:text-rose-800"
                        >
                          <XCircle className="h-4 w-4" />
                          Recusar
                        </Button>
                      ) : null}
                      {canCancel ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelReservation(reservation.id)}
                          className="text-red-700 hover:text-red-800"
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
                          className="text-red-700 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
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
  if (disabled) return <span className="text-xs text-slate-400">-</span>;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 whitespace-nowrap px-2 text-xs text-blue-700 hover:bg-blue-50"
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
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
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
              <InfoItem label="Responsável" value={preview.performedBy ? preview.performedBy.name : "-"} />
              <InfoItem
                label="E-mail"
                value={preview.performedBy ? preview.performedBy.email : "-"}
              />
            </div>

            {parsed.items.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Itens conferidos</h4>
                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                  {parsed.items.map((item) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[1fr_auto]"
                    >
                      <span className="text-slate-700">{item.label}</span>
                      <span className="font-medium text-slate-950">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">Observações</h4>
              <div className="min-h-16 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
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
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <InfoItem label="Solicitante" value={reservation.requesterName} />
              <InfoItem label="E-mail" value={reservation.requesterEmail ?? "-"} />
              <InfoItem label="Veículo" value={`${reservation.vehicleName} - ${reservation.plate}`} />
              <InfoItem label="Status" value={reservation.status} />
              <InfoItem label="Revisado por" value={reservation.reviewedByName ?? "-"} />
              <InfoItem
                label="Revisado em"
                value={reservation.reviewedAt ? formatDate(reservation.reviewedAt) : "-"}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">Solicitação original</h4>
              <div className="grid gap-3 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-2">
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
                <h4 className="text-sm font-semibold text-slate-900">Recusa</h4>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {reservation.rejectionReason}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">Checklist e ações</h4>
              <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                {(reservation.logs ?? []).length > 0 ? (
                  reservation.logs!.map((log) => (
                    <div key={log.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-medium text-slate-950">{log.action}</p>
                        <p className="text-xs text-slate-500">
                          {log.user.name} - {log.user.email}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">Sem eventos de auditoria.</div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Retirada</h4>
                <div className="rounded-lg border border-slate-200 p-4 text-sm">
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-900">Data:</span>{" "}
                    {formatDateTime(reservation.pickup?.date ?? "", reservation.pickup?.time ?? "")}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-900">KM:</span>{" "}
                    {reservation.pickup?.kmStart ?? "-"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-900">Responsável:</span>{" "}
                    {reservation.pickup?.createdBy?.name ?? "-"}
                  </p>
                  <PhotoLink href={reservation.pickup?.photoUrl} label="Foto retirada" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Devolução</h4>
                <div className="rounded-lg border border-slate-200 p-4 text-sm">
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-900">Data:</span>{" "}
                    {formatDateTime(reservation.return?.date ?? "", reservation.return?.time ?? "")}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-900">KM:</span>{" "}
                    {reservation.return?.kmEnd ?? "-"}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-medium text-slate-900">Responsável:</span>{" "}
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
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

function PhotoLink({ href, label }: { href?: string; label: string }) {
  if (!href) return <span className="text-xs text-slate-400">-</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

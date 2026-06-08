import {
  Ban,
  BarChart3,
  Car,
  ClipboardList,
  Crown,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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
  currentUserId: string;
  onChangeUserRole: (userId: string, roleId: string) => void;
  onDeleteUser: (userId: string) => void;
  onChangeVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  onCancelReservation: (reservationId: string) => void;
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
  "Reservado",
  "Em uso",
  "Finalizada",
  "Cancelada",
];

export function AdminPanel({
  isAdmin,
  activeSection,
  vehicles,
  reservations,
  users,
  roles,
  isLoadingUsers,
  canManageUsers,
  currentUserId,
  onChangeUserRole,
  onDeleteUser,
  onChangeVehicleStatus,
  onCancelReservation,
  onRequestAccess,
}: AdminPanelProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id ?? "");
  const [vehicleFilter, setVehicleFilter] = useState("Todos");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "Todos">("Todos");
  const [periodFilter, setPeriodFilter] = useState("");

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
    const matchesDepartment = !departmentFilter || reservation.department === departmentFilter;
    const matchesStatus = statusFilter === "Todos" || reservation.status === statusFilter;
    const matchesPeriod = !periodFilter || reservation.pickupDate === periodFilter;
    return matchesVehicle && matchesDepartment && matchesStatus && matchesPeriod;
  });

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

  return (
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
            onDeleteUser={onDeleteUser}
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
            onCancelReservation={onCancelReservation}
          />
        </div>
      ) : null}

      {activeSection === "historicoGeral" ? (
        <div
          id="admin-historico-geral"
          className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h3 className="mb-5 text-lg font-bold text-slate-950">Histórico geral</h3>
          <div className="mb-5 grid gap-3 md:grid-cols-4">
            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>Todos</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate}
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
          <AdminHistoryTable
            reservations={filteredReservations}
            vehicles={vehicles}
            onCancelReservation={onCancelReservation}
          />
        </div>
      ) : null}
    </section>
  );
}

function AdminUsersTable({
  users,
  roles,
  currentUserId,
  isLoading,
  onChangeUserRole,
  onDeleteUser,
}: {
  users: AdminUser[];
  roles: AdminRole[];
  currentUserId: string;
  isLoading: boolean;
  onChangeUserRole: (userId: string, roleId: string) => void;
  onDeleteUser: (userId: string) => void;
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
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>
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
  onCancelReservation,
}: {
  reservations: Reservation[];
  vehicles: Vehicle[];
  onCancelReservation: (reservationId: string) => void;
}) {
  return reservations.length === 0 ? (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      Nenhum registro encontrado.
    </div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Solicitante</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>Solicitado</TableHead>
          <TableHead>Utilizado</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Saída</TableHead>
          <TableHead>Retorno</TableHead>
          <TableHead>KM inicial</TableHead>
          <TableHead>KM final</TableHead>
          <TableHead>Foto retirada</TableHead>
          <TableHead>Foto devolução</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => {
          const usedVehicle = vehicles.find((vehicle) => vehicle.id === reservation.usedVehicleId);
          const canCancel = ["Reservado", "Em uso"].includes(reservation.status);
          return (
            <TableRow key={reservation.id}>
              <TableCell>{reservation.requesterName}</TableCell>
              <TableCell>{reservation.department}</TableCell>
              <TableCell>{reservation.plate}</TableCell>
              <TableCell>{usedVehicle?.plate ?? "-"}</TableCell>
              <TableCell className="max-w-[220px]">{reservation.reason}</TableCell>
              <TableCell>
                {formatDateTime(reservation.pickupDate, reservation.pickupTime)}
              </TableCell>
              <TableCell>
                {formatDateTime(reservation.returnDate, reservation.returnTime)}
              </TableCell>
              <TableCell>{reservation.pickup?.kmStart ?? "-"}</TableCell>
              <TableCell>{reservation.return?.kmEnd ?? "-"}</TableCell>
              <TableCell>
                <PhotoLink href={reservation.pickup?.photoUrl} label="Retirada" />
              </TableCell>
              <TableCell>
                <PhotoLink href={reservation.return?.photoUrl} label="Devolução" />
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${reservationStatusStyles[reservation.status]}`}
                >
                  {reservation.status}
                </span>
              </TableCell>
              <TableCell>
                {canCancel ? (
                  <div className="flex flex-wrap gap-2">
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
  );
}

function formatDateTime(date: string, time: string) {
  if (!date || !time) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time}`;
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

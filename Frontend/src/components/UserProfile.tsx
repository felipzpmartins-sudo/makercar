import { Building2, Crown, Mail, ShieldCheck, UserCircle } from "lucide-react";
import type { ReactNode } from "react";

import type { AuthUser } from "@/services/authClient";
import { isSupremeOwnerRole } from "@/utils/roles";

interface UserProfileProps {
  user: AuthUser;
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <section
      id="perfil"
      className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950">
          <UserCircle className="h-5 w-5 text-blue-600" />
          Perfil do usuário
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Dados usados para identificar suas reservas no MakerCar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ProfileItem icon={<UserCircle />} label="Nome" value={user.name} />
        <ProfileItem icon={<Mail />} label="E-mail" value={user.email} />
        <ProfileItem icon={<Building2 />} label="Departamento" value={user.department.name} />
        <ProfileItem
          icon={isSupremeOwnerRole(user.role.name) ? <Crown /> : <ShieldCheck />}
          label="Perfil"
          value={user.role.name}
          isSupreme={isSupremeOwnerRole(user.role.name)}
        />
      </div>
    </section>
  );
}

function ProfileItem({
  icon,
  label,
  value,
  isSupreme = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isSupreme?: boolean;
}) {
  return (
    <div
      className={
        isSupreme
          ? "rounded-lg border border-amber-200 bg-amber-50 p-4"
          : "rounded-lg border border-slate-200 bg-slate-50 p-4"
      }
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <span
          className={`${isSupreme ? "text-amber-600" : "text-blue-600"} [&_svg]:h-4 [&_svg]:w-4`}
        >
          {icon}
        </span>
        {label}
      </div>
      <p className={`mt-2 truncate font-semibold ${isSupreme ? "text-amber-950" : "text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}

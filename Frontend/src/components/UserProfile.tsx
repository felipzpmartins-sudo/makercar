import { Building2, CreditCard, Crown, Mail, ShieldCheck, UserCircle } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, type AuthUser } from "@/services/authClient";
import { getStoredAuthSession, saveAuthSession } from "@/utils/authStorage";
import { imageFileToDataUrl } from "@/utils/imageUpload";
import { isSupremeOwnerRole } from "@/utils/roles";

interface UserProfileProps {
  user: AuthUser;
}

export function UserProfile({ user }: UserProfileProps) {
  const [cnhNumber, setCnhNumber] = useState(user.cnhNumber ?? "");
  const [cnhExpiresAt, setCnhExpiresAt] = useState(user.cnhExpiresAt?.slice(0, 10) ?? "");
  const [cnhPhotoDataUrl, setCnhPhotoDataUrl] = useState("");
  const [isSavingCnh, setIsSavingCnh] = useState(false);

  async function handleCnhSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cnhPhotoDataUrl) {
      toast.error("Envie uma foto legivel da CNH.");
      return;
    }
    setIsSavingCnh(true);
    try {
      const updatedUser = await authClient.updateCnh({ cnhNumber, cnhExpiresAt, cnhPhotoDataUrl });
      const session = getStoredAuthSession();
      if (session) saveAuthSession({ ...session, user: updatedUser });
      toast.success("CNH enviada para analise.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar a CNH.");
    } finally {
      setIsSavingCnh(false);
    }
  }

  const cnhStatusLabel =
    user.cnhStatus === "APPROVED"
      ? "Aprovada"
      : user.cnhStatus === "REJECTED"
        ? "Recusada"
        : user.cnhStatus === "PENDING"
          ? "Em analise"
          : "Nao enviada";

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ProfileItem icon={<UserCircle />} label="Nome" value={user.name} />
        <ProfileItem icon={<Mail />} label="E-mail" value={user.email} />
        <ProfileItem icon={<Building2 />} label="Departamento" value={user.department.name} />
        <ProfileItem icon={<CreditCard />} label="CNH" value={cnhStatusLabel} />
        <ProfileItem
          icon={isSupremeOwnerRole(user.role.name) ? <Crown /> : <ShieldCheck />}
          label="Perfil"
          value={user.role.name}
          isSupreme={isSupremeOwnerRole(user.role.name)}
        />
      </div>

      <form
        onSubmit={handleCnhSubmit}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <div>
          <h3 className="font-semibold text-slate-950">
            {user.cnhNumber ? "Renovar CNH" : "Cadastrar CNH"}
          </h3>
          <p className="text-sm text-slate-600">
            Ao enviar um novo documento, ele volta para analise administrativa.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            inputMode="numeric"
            pattern="[0-9]{11}"
            maxLength={11}
            value={cnhNumber}
            onChange={(event) => setCnhNumber(event.target.value.replace(/\D/g, ""))}
            placeholder="Numero da CNH"
            required
          />
          <Input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={cnhExpiresAt}
            onChange={(event) => setCnhExpiresAt(event.target.value)}
            required
          />
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void imageFileToDataUrl(file)
                .then(setCnhPhotoDataUrl)
                .catch(() => toast.error("Foto invalida."));
            }}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isSavingCnh}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <CreditCard className="h-4 w-4" />{" "}
          {isSavingCnh ? "Enviando..." : "Enviar CNH para analise"}
        </Button>
      </form>
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
      <p
        className={`mt-2 truncate font-semibold ${isSupreme ? "text-amber-950" : "text-slate-950"}`}
      >
        {value}
      </p>
    </div>
  );
}

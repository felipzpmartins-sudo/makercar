import {
  Building2,
  CreditCard,
  Crown,
  FileText,
  Mail,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, type AuthUser } from "@/services/authClient";
import { getStoredAuthSession, saveAuthSession } from "@/utils/authStorage";
import { cnhFileToDataUrl } from "@/utils/imageUpload";
import { isSupremeOwnerRole } from "@/utils/roles";

interface UserProfileProps {
  user: AuthUser;
}

export function UserProfile({ user }: UserProfileProps) {
  const [cnhNumber, setCnhNumber] = useState(user.cnhNumber ?? "");
  const [cnhExpiresAt, setCnhExpiresAt] = useState(user.cnhExpiresAt?.slice(0, 10) ?? "");
  const [cnhPhotoDataUrl, setCnhPhotoDataUrl] = useState("");
  const [isSavingCnh, setIsSavingCnh] = useState(false);
  const hasCnhOnFile = Boolean(user.cnhNumber && user.cnhExpiresAt && user.cnhStatus);
  const [isReplacingCnh, setIsReplacingCnh] = useState(
    !hasCnhOnFile || user.cnhStatus === "REJECTED",
  );

  async function handleCnhSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cnhPhotoDataUrl) {
      toast.error("Envie uma imagem ou PDF legivel da CNH.");
      return;
    }
    setIsSavingCnh(true);
    try {
      const updatedUser = await authClient.updateCnh({ cnhNumber, cnhExpiresAt, cnhPhotoDataUrl });
      const session = getStoredAuthSession();
      if (session) saveAuthSession({ ...session, user: updatedUser });
      toast.success("CNH salva e enviada para analise.");
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
        <ProfileItem
          icon={<CreditCard />}
          label="CNH"
          value={cnhStatusLabel}
          isCnhApproved={user.cnhStatus === "APPROVED"}
        />
        <ProfileItem
          icon={isSupremeOwnerRole(user.role.name) ? <Crown /> : <ShieldCheck />}
          label="Perfil"
          value={user.role.name}
          isSupreme={isSupremeOwnerRole(user.role.name)}
        />
      </div>

      {hasCnhOnFile && !isReplacingCnh ? (
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-slate-950">
              <FileText className="h-4 w-4 text-blue-600" />
              CNH cadastrada
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Documento salvo, com validade ate {formatCnhDate(user.cnhExpiresAt!)}. Ele sera usado
              nas suas proximas reservas.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setIsReplacingCnh(true)}>
            Atualizar CNH
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleCnhSubmit}
          className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <div>
            <h3 className="font-semibold text-slate-950">
              {user.cnhNumber ? "Atualizar CNH" : "Cadastrar CNH"}
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
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void cnhFileToDataUrl(file)
                  .then(setCnhPhotoDataUrl)
                  .catch((error) =>
                    toast.error(error instanceof Error ? error.message : "Arquivo invalido."),
                  );
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
            {isSavingCnh ? "Enviando..." : "Salvar CNH para analise"}
          </Button>
        </form>
      )}
    </section>
  );
}

function formatCnhDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function ProfileItem({
  icon,
  label,
  value,
  isSupreme = false,
  isCnhApproved = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isSupreme?: boolean;
  isCnhApproved?: boolean;
}) {
  const isHighlighted = isSupreme || isCnhApproved;

  return (
    <div
      className={
        isSupreme
          ? "rounded-lg border border-amber-200 bg-amber-50 p-4"
          : isCnhApproved
            ? "rounded-lg border border-emerald-200 bg-emerald-50 p-4"
            : "rounded-lg border border-slate-200 bg-slate-50 p-4"
      }
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <span
          className={`${
            isSupreme ? "text-amber-600" : isCnhApproved ? "text-emerald-600" : "text-blue-600"
          } [&_svg]:h-4 [&_svg]:w-4`}
        >
          {icon}
        </span>
        {label}
      </div>
      <p
        className={`mt-2 truncate font-semibold ${
          isSupreme ? "text-amber-950" : isCnhApproved ? "text-emerald-950" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

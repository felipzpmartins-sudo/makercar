import { KeyRound, Loader2, LogOut } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, type AuthSession } from "@/services/authClient";
import { saveAuthSession } from "@/utils/authStorage";

interface PasswordChangeRequiredProps {
  session: AuthSession;
  onLogout: () => void;
}

export function PasswordChangeRequired({ session, onLogout }: PasswordChangeRequiredProps) {
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("As senhas nao conferem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const nextSession = await authClient.changePassword({
        newPassword: passwordForm.newPassword,
      });
      saveAuthSession(nextSession);
      toast.success("Senha atualizada com sucesso.");
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar a senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <KeyRound className="h-5 w-5" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight">Crie sua senha definitiva</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          O administrador definiu uma senha temporaria para {session.user.email}. Antes de usar o
          MakerCar, escolha uma nova senha.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound />}
            Salvar nova senha
          </Button>
        </form>

        <Button type="button" variant="ghost" className="mt-3 w-full" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </main>
  );
}

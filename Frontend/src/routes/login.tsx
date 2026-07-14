import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/services/authClient";
import { getStoredAuthSession, saveAuthSession } from "@/utils/authStorage";
import { imageFileToDataUrl } from "@/utils/imageUpload";

const makercarLogo = "/makercar-assets/site-icon.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "MakerCar - Login" },
      {
        name: "description",
        content: "Acesse ou crie sua conta MakerCar.",
      },
    ],
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "Administrativo",
    cnhNumber: "",
    cnhExpiresAt: "",
    cnhPhotoDataUrl: "",
  });

  useEffect(() => {
    if (getStoredAuthSession()) {
      window.location.assign("/");
    }
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const session = await authClient.login(loginForm);
      saveAuthSession(session);
      toast.success("Login realizado com sucesso.");
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (!registerForm.cnhPhotoDataUrl) throw new Error("Envie uma foto legivel da CNH.");
      const session = await authClient.register(registerForm);
      saveAuthSession(session);
      toast.success("Conta criada com sucesso.");
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a conta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-950 text-white lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden min-h-screen flex-col justify-between overflow-hidden bg-blue-700 px-10 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <img src={makercarLogo} alt="MakerCar" className="h-11 w-11 rounded-lg bg-white/10" />
          <span className="text-xl font-bold">MakerCar</span>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
            Acesso corporativo
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight">
            Gestão de frota com usuário identificado em cada reserva.
          </h1>
          <p className="mt-5 text-base leading-7 text-blue-50">
            Cada colaborador acessa sua conta, cria reservas e mantém o histórico vinculado ao
            próprio perfil.
          </p>
        </div>

        <div />
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <img src={makercarLogo} alt="MakerCar" className="mx-auto h-12 w-12 rounded-lg" />
            <h1 className="mt-3 text-2xl font-bold">MakerCar</h1>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <div className="mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">Acesse sua conta</h2>
              <p className="mt-1 text-sm text-slate-600">
                Entre ou crie seu cadastro para usar o sistema.
              </p>
            </div>

            <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5">
                <form className="space-y-4" onSubmit={handleLogin}>
                  <FormField label="E-mail" htmlFor="login-email">
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, email: event.target.value }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Senha" htmlFor="login-password">
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({ ...current, password: event.target.value }))
                      }
                      required
                    />
                  </FormField>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-5">
                <form className="space-y-4" onSubmit={handleRegister}>
                  <FormField label="Nome completo" htmlFor="register-name">
                    <Input
                      id="register-name"
                      autoComplete="name"
                      value={registerForm.name}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="E-mail" htmlFor="register-email">
                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, email: event.target.value }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Departamento" htmlFor="register-department">
                    <Input
                      id="register-department"
                      value={registerForm.department}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          department: event.target.value,
                        }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Numero da CNH" htmlFor="register-cnh-number">
                    <Input
                      id="register-cnh-number"
                      inputMode="numeric"
                      pattern="[0-9]{11}"
                      maxLength={11}
                      value={registerForm.cnhNumber}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          cnhNumber: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Validade da CNH" htmlFor="register-cnh-expiry">
                    <Input
                      id="register-cnh-expiry"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={registerForm.cnhExpiresAt}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          cnhExpiresAt: event.target.value,
                        }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Foto da CNH" htmlFor="register-cnh-photo">
                    <Input
                      id="register-cnh-photo"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void imageFileToDataUrl(file)
                          .then((dataUrl) =>
                            setRegisterForm((current) => ({
                              ...current,
                              cnhPhotoDataUrl: dataUrl,
                            })),
                          )
                          .catch((error) =>
                            toast.error(error instanceof Error ? error.message : "Foto invalida."),
                          );
                      }}
                      required
                    />
                    <p className="text-xs text-slate-500">Envie uma imagem legivel do documento.</p>
                  </FormField>{" "}
                  <FormField label="Senha" htmlFor="register-password">
                    <Input
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      required
                    />
                  </FormField>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            A conta criada entra como Colaborador. Permissões administrativas continuam no painel
            restrito.
          </p>
          <p className="mt-3 text-center text-xs text-slate-500">
            <a
              className="font-medium text-blue-600 hover:text-blue-700"
              href="/politica-de-privacidade"
            >
              Politica de Privacidade
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

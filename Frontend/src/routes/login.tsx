import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/services/authClient";
import { getStoredAuthSession, saveAuthSession } from "@/utils/authStorage";

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
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.95fr_1.05fr]">
      {/* Painel de marca: so no desktop, onde ha espaco de sobra. */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-brand-panel px-10 py-10 text-brand-panel-foreground lg:flex">
        {/* Malha sutil ao fundo — textura, nao decoracao gritante. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/[0.07] blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <img
            src={makercarLogo}
            alt=""
            className="h-11 w-11 rounded-lg bg-white/15 p-1 ring-1 ring-white/20"
          />
          <span className="text-xl font-semibold tracking-tight">MakerCar</span>
        </div>

        <div className="relative max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-panel-foreground/65">
            Sistema corporativo de frota
          </p>
          <h1 className="mt-4 text-[2.75rem] font-semibold leading-[1.1] tracking-tight">
            Reserva de veículos com responsável identificado.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-brand-panel-foreground/80">
            Cada colaborador acessa a própria conta, solicita o veículo e mantém retirada, devolução
            e quilometragem registradas no seu histórico.
          </p>
        </div>

        <ul className="relative flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-panel-foreground/70">
          {["Aprovação pelo RH", "Checklist de retirada", "Histórico por veículo"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <img src={makercarLogo} alt="" className="mx-auto h-12 w-12 rounded-xl" />
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">MakerCar</h1>
            <p className="mt-1 text-sm text-muted-foreground">Reserva de veículos corporativos</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-md sm:p-7">
            <div className="mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary ring-1 ring-primary/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">Acesse sua conta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
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
                  <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                    {isSubmitting ? null : <KeyRound />}
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
                  <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                    {isSubmitting ? null : <Mail />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            A conta criada entra como Colaborador. Permissões administrativas continuam no painel
            restrito.
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <a
              className="font-medium text-primary hover:text-primary"
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

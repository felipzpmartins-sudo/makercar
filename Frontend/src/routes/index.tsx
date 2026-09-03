import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Bot, Car, ClipboardList, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { FullPageLoader } from "@/components/LoadingStates";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PasswordChangeRequired } from "@/components/PasswordChangeRequired";
import { useAuthSession } from "@/hooks/useAuthSession";
import { canAccessAdminRole, canManageEquipmentRole } from "@/utils/roles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MakerCar - Central de Reservas" },
      {
        name: "description",
        content:
          "Central de reservas da MKR: veículos corporativos e equipamentos internos em um só lugar.",
      },
    ],
  }),
  component: CentralRoute,
});

/*
 * Central de Reservas — a primeira tela depois do login.
 *
 * Duas escolhas, nada mais. A tela nao busca dados de proposito: e o primeiro
 * frame apos o login e precisa aparecer inteira de imediato. O que cada modulo
 * contem esta escrito no proprio card, entao a decisao nao depende de espera.
 */
function CentralRoute() {
  const { session, isCheckingSession, logout } = useAuthSession({ redirectToLogin: true });

  if (isCheckingSession || !session) {
    return <FullPageLoader label="Verificando seu acesso..." />;
  }

  if (session.user.mustChangePassword) {
    return <PasswordChangeRequired session={session} onLogout={logout} />;
  }

  const firstName = session.user.name.trim().split(/\s+/)[0];
  const isAdmin = canAccessAdminRole(session.user.role.name);
  const isEquipmentAdmin = canManageEquipmentRole(session.user.role.name);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ModuleHeader
        title="Central de Reservas"
        subtitle="Escolha o que deseja reservar"
        currentUser={session.user}
        onLogout={logout}
      />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="animate-fade-rise max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {session.user.department.name}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Olá, {firstName}.
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            O que você quer reservar hoje? Escolha um dos módulos abaixo para começar.
          </p>
        </header>

        <div className="stagger mt-8 grid gap-5 sm:mt-10 lg:grid-cols-2 lg:gap-6">
          <ModuleCard
            href="/frota"
            icon={<Car />}
            eyebrow="Módulo 1"
            title="Reserva de Carro"
            description="Reserve um veículo para sua atividade."
            details={["Frota Renault Kwid e Master", "Retirada e devolução com registro de KM"]}
            visual={
              <img
                src="/makercar-assets/kwid-white.png"
                alt=""
                loading="lazy"
                decoding="async"
                className="relative z-10 max-h-[132px] w-auto max-w-[78%] object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-[1.06] sm:max-h-[150px]"
              />
            }
          />

          <ModuleCard
            href="/equipamentos"
            icon={<Bot />}
            eyebrow="Módulo 2"
            title="Reserva de Equipamento"
            description="Reserve equipamentos tecnológicos para apresentações, eventos e atividades internas."
            details={["Robô Humanoide e Robô Cachorro", "Sujeito a aprovação do administrador"]}
            visual={
              // Os dois equipamentos aparecem juntos: e o que diferencia este
              // card do de veiculos numa olhada rapida.
              <div className="relative z-10 flex h-full w-full items-end justify-center gap-1 pb-1 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
                <img
                  src="/makercar-assets/robo-cachorro.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-h-[104px] w-auto object-contain drop-shadow-2xl sm:max-h-[118px]"
                />
                <img
                  src="/makercar-assets/robo-humanoide.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-h-[140px] w-auto object-contain drop-shadow-2xl sm:max-h-[162px]"
                />
              </div>
            }
          />
        </div>

        {isAdmin || isEquipmentAdmin ? (
          <section className="mt-10 sm:mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administração
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {isAdmin ? (
                <ShortcutLink
                  href="/admin"
                  icon={<ShieldCheck />}
                  label="Painel da frota"
                  description="Reservas, veículos e CNH"
                />
              ) : null}
              {isEquipmentAdmin ? (
                <ShortcutLink
                  href="/equipamentos-admin"
                  icon={<ClipboardList />}
                  label="Painel de equipamentos"
                  description="Aprovações e calendário"
                />
              ) : null}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 MakerCar - Central de Reservas MKR</p>
          <p>Veículos corporativos e equipamentos internos</p>
        </div>
      </footer>
    </div>
  );
}

/*
 * Card de modulo.
 *
 * O corpo inteiro e um link: alvo grande, funciona no toque e mantem um unico
 * ponto de foco por card no teclado. O "Acessar" e uma marcacao visual dentro
 * do mesmo link, nao um segundo botao.
 */
function ModuleCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  details,
  visual,
}: {
  href: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  details: string[];
  visual: ReactNode;
}) {
  return (
    <a
      href={href}
      className={[
        "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      ].join(" ")}
    >
      <div className="eq-stage eq-grid relative flex h-44 items-end justify-center sm:h-52">
        <div className="eq-halo opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="eq-floor bottom-5 h-7 w-[46%]" />
        {visual}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary ring-1 ring-primary/15 [&_svg]:h-4.5 [&_svg]:w-4.5"
            aria-hidden
          >
            {icon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>

        <ul className="mt-4 space-y-1.5">
          {details.map((detail) => (
            <li key={detail} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
              {detail}
            </li>
          ))}
        </ul>

        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Acessar
          <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </span>
      </div>
    </a>
  );
}

function ShortcutLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs transition-colors duration-200 ease-out hover:border-border-strong hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-200 group-hover:text-primary [&_svg]:h-4 [&_svg]:w-4"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="ml-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
    </a>
  );
}

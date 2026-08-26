import { createFileRoute } from "@tanstack/react-router";

const supportEmail = "felipzpmartins@gmail.com";

export const Route = createFileRoute("/exclusao-de-conta")({
  head: () => ({
    meta: [
      { title: "Exclusao de Conta - MakerCar" },
      {
        name: "description",
        content: "Solicite a exclusao da sua conta e dos seus dados no MakerCar.",
      },
    ],
  }),
  component: AccountDeletionRoute,
});

function AccountDeletionRoute() {
  return (
    <main className="min-h-screen bg-muted px-4 py-10 text-foreground sm:px-6">
      <article className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">MakerCar</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Exclusao de Conta e Dados
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Ultima atualizacao: 11 de junho de 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Como solicitar a exclusao</h2>
            <p className="mt-2">
              Para solicitar a exclusao da sua conta MakerCar e dos dados pessoais associados, envie
              um e-mail para{" "}
              <a
                className="font-medium text-primary hover:text-primary"
                href={`mailto:${supportEmail}?subject=Solicitacao%20de%20exclusao%20de%20conta%20MakerCar`}
              >
                {supportEmail}
              </a>{" "}
              usando o mesmo endereco de e-mail cadastrado no app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              Informacoes que devem constar no pedido
            </h2>
            <p className="mt-2">
              Informe seu nome completo, e-mail cadastrado e escreva que deseja excluir sua conta e
              seus dados do MakerCar. Podemos solicitar confirmacao adicional para proteger a conta
              contra pedidos indevidos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Dados excluidos</h2>
            <p className="mt-2">
              Quando a solicitacao for aprovada, removeremos ou anonimizaremos dados pessoais
              relacionados a cadastro, acesso e perfil de usuario, como nome, e-mail, departamento,
              credenciais e identificadores de sessao.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Dados que podem ser mantidos</h2>
            <p className="mt-2">
              Alguns registros operacionais podem ser mantidos pelo tempo necessario para cumprir
              obrigacoes legais, auditoria, seguranca, controle de frota e administracao interna,
              como historico de reservas, retiradas, devolucoes, quilometragem, checklists e
              ocorrencias associadas ao uso de veiculos corporativos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Prazo de atendimento</h2>
            <p className="mt-2">
              As solicitacoes serao analisadas e respondidas em prazo razoavel, de acordo com a
              verificacao da identidade do solicitante e as necessidades legais e operacionais
              aplicaveis.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

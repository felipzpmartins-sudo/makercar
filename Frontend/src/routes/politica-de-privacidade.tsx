import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Politica de Privacidade - MakerCar" },
      {
        name: "description",
        content:
          "Politica de privacidade do MakerCar para usuarios, reservas e gestao de frota corporativa.",
      },
    ],
  }),
  component: PrivacyPolicyRoute,
});

function PrivacyPolicyRoute() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">MakerCar</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Politica de Privacidade
        </h1>
        <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: 11 de junho de 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-950">1. Sobre esta politica</h2>
            <p className="mt-2">
              Esta Politica de Privacidade explica como o MakerCar trata dados pessoais e
              informacoes operacionais usadas para gerenciamento, reserva, retirada e devolucao de
              veiculos corporativos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">2. Dados que podemos coletar</h2>
            <p className="mt-2">
              Podemos coletar dados de cadastro e acesso, como nome, e-mail, senha criptografada,
              departamento, perfil de permissao, numero, validade e imagem da CNH e identificadores
              de sessao. Tambem podemos tratar dados relacionados ao uso do sistema, como reservas,
              datas de retirada e devolucao, veiculo solicitado, motivo da reserva, quilometragem,
              historico de uso, status da reserva e registros de checklist.
            </p>
            <p className="mt-2">
              Quando a funcionalidade for utilizada, o MakerCar tambem pode receber imagens ou
              arquivos enviados pelo usuario para registrar condicoes do veiculo, comprovantes ou
              ocorrencias operacionais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">3. Como usamos os dados</h2>
            <p className="mt-2">
              Usamos os dados para autenticar usuarios, controlar permissoes, registrar reservas,
              validar a habilitacao para dirigir, organizar a disponibilidade da frota, acompanhar
              retiradas e devolucoes, manter historico operacional, prevenir uso indevido e oferecer
              suporte aos usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">4. Compartilhamento</h2>
            <p className="mt-2">
              Os dados podem ser acessados por administradores autorizados da organizacao
              responsavel pelo MakerCar e por fornecedores de infraestrutura necessarios para
              hospedagem, armazenamento, seguranca, banco de dados e processamento do sistema. Nao
              vendemos dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">5. Seguranca</h2>
            <p className="mt-2">
              Adotamos medidas tecnicas e organizacionais para proteger as informacoes, incluindo
              controle de acesso, autenticacao por credenciais, armazenamento protegido e trafego
              criptografado quando o sistema e acessado por HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">6. Retencao e exclusao</h2>
            <p className="mt-2">
              Mantemos os dados pelo tempo necessario para operar o sistema, cumprir obrigacoes
              legais, preservar registros administrativos e atender solicitacoes da organizacao. O
              usuario pode solicitar correcao, consulta ou exclusao de dados, observados os limites
              legais e operacionais aplicaveis.
            </p>
            <p className="mt-2">
              As solicitacoes de exclusao podem ser feitas pela pagina{" "}
              <a
                className="font-medium text-blue-600 hover:text-blue-700"
                href="/exclusao-de-conta"
              >
                Exclusao de Conta e Dados
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">7. Publico-alvo</h2>
            <p className="mt-2">
              O MakerCar e destinado ao uso corporativo e nao e direcionado a criancas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-950">8. Contato</h2>
            <p className="mt-2">
              Para duvidas sobre esta politica ou solicitacoes relacionadas a dados pessoais, entre
              em contato pelo e-mail{" "}
              <a
                className="font-medium text-blue-600 hover:text-blue-700"
                href="mailto:felipzpmartins@gmail.com"
              >
                felipzpmartins@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

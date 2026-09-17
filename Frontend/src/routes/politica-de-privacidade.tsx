import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade - MakerCar" },
      {
        name: "description",
        content:
          "Política de privacidade do MakerCar para usuários, reservas e gestão de frota corporativa.",
      },
    ],
  }),
  component: PrivacyPolicyRoute,
});

function PrivacyPolicyRoute() {
  return (
    <main className="min-h-screen bg-muted px-4 py-10 text-foreground sm:px-6">
      <article className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">MakerCar</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: 11 de junho de 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Sobre esta política</h2>
            <p className="mt-2">
              Esta Política de Privacidade explica como o MakerCar trata dados pessoais e
              informações operacionais usadas para gerenciamento, reserva, retirada e devolução de
              veículos corporativos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Dados que podemos coletar</h2>
            <p className="mt-2">
              Podemos coletar dados de cadastro e acesso, como nome, e-mail, senha criptografada,
              departamento, perfil de permissão, número, validade e imagem da CNH e identificadores
              de sessão. Também podemos tratar dados relacionados ao uso do sistema, como reservas,
              datas de retirada e devolução, veículo solicitado, motivo da reserva, quilometragem,
              histórico de uso, status da reserva e registros de checklist.
            </p>
            <p className="mt-2">
              Quando a funcionalidade for utilizada, o MakerCar também pode receber imagens ou
              arquivos enviados pelo usuário para registrar condições do veículo, comprovantes ou
              ocorrências operacionais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Como usamos os dados</h2>
            <p className="mt-2">
              Usamos os dados para autenticar usuários, controlar permissões, registrar reservas,
              validar a habilitação para dirigir, organizar a disponibilidade da frota, acompanhar
              retiradas e devoluções, manter histórico operacional, prevenir uso indevido e oferecer
              suporte aos usuários.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Compartilhamento</h2>
            <p className="mt-2">
              Os dados podem ser acessados por administradores autorizados da organização
              responsável pelo MakerCar e por fornecedores de infraestrutura necessários para
              hospedagem, armazenamento, segurança, banco de dados e processamento do sistema. Não
              vendemos dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Segurança</h2>
            <p className="mt-2">
              Adotamos medidas técnicas e organizacionais para proteger as informações, incluindo
              controle de acesso, autenticação por credenciais, armazenamento protegido e tráfego
              criptografado quando o sistema é acessado por HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Retenção e exclusão</h2>
            <p className="mt-2">
              Mantemos os dados pelo tempo necessário para operar o sistema, cumprir obrigações
              legais, preservar registros administrativos e atender solicitações da organização. O
              usuário pode solicitar correção, consulta ou exclusão de dados, observados os limites
              legais e operacionais aplicáveis.
            </p>
            <p className="mt-2">
              As solicitações de exclusão podem ser feitas pela página{" "}
              <a
                className="font-medium text-primary hover:text-primary"
                href="/exclusao-de-conta"
              >
                Exclusão de Conta e Dados
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Público-alvo</h2>
            <p className="mt-2">
              O MakerCar é destinado ao uso corporativo e não é direcionado a crianças.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Contato</h2>
            <p className="mt-2">
              Para dúvidas sobre esta política ou solicitações relacionadas a dados pessoais, entre
              em contato pelo e-mail{" "}
              <a
                className="font-medium text-primary hover:text-primary"
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

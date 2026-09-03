/*
 * Termo de responsabilidade da reserva de equipamentos.
 *
 * Fica no codigo, e nao no banco, porque e um texto juridico revisado junto com
 * o deploy — versionar aqui deixa o historico no git. A reserva guarda a versao
 * aceita (terms_version), entao mudar o texto no futuro nao reescreve o que as
 * pessoas ja aceitaram: basta subir EQUIPMENT_TERMS_VERSION.
 */

export const EQUIPMENT_TERMS_VERSION = "1.0";

export interface EquipmentTermsSection {
  title: string;
  items: string[];
}

export interface EquipmentTerms {
  version: string;
  title: string;
  summary: string;
  updatedAt: string;
  sections: EquipmentTermsSection[];
}

export const equipmentTerms: EquipmentTerms = {
  version: EQUIPMENT_TERMS_VERSION,
  title: "Termo de Responsabilidade — Equipamentos Internos",
  summary:
    "Ao solicitar a reserva de um equipamento interno da MKR, o responsável declara ciência e concordância com as condições abaixo.",
  updatedAt: "2026-09-02",
  sections: [
    {
      title: "1. Do responsável",
      items: [
        "O usuário que envia a solicitação é o responsável formal pelo equipamento durante todo o período reservado, ainda que a operação seja feita por outra pessoa ou equipe indicada no campo de utilização.",
        "A responsabilidade começa na retirada do equipamento e só termina após a devolução ser conferida pela equipe responsável pela guarda.",
        "A reserva é pessoal e intransferível: repassar o equipamento a terceiros não indicados na solicitação exige nova autorização.",
      ],
    },
    {
      title: "2. Do uso",
      items: [
        "O equipamento deve ser utilizado exclusivamente para a finalidade declarada na solicitação e no local informado.",
        "É vedado o uso para fins particulares, comerciais externos ou qualquer atividade não relacionada às operações da empresa.",
        "Alterações de firmware, desmontagem, reparos por conta própria ou instalação de acessórios não homologados são proibidas.",
        "O equipamento não deve ser operado por pessoas sem orientação prévia, nem exposto a chuva, poeira excessiva, calor extremo ou aglomerações sem isolamento adequado.",
      ],
    },
    {
      title: "3. Do transporte e da guarda",
      items: [
        "O transporte deve ser feito com o case ou embalagem original, devidamente acondicionado.",
        "O equipamento não pode ser deixado sem supervisão em locais públicos, veículos destrancados ou áreas de acesso irrestrito.",
        "Baterias devem ser carregadas apenas com os carregadores originais fornecidos junto ao equipamento.",
      ],
    },
    {
      title: "4. De danos, perdas e devolução",
      items: [
        "Qualquer avaria, mau funcionamento, perda ou furto deve ser comunicado imediatamente ao administrador do sistema, ainda durante o período da reserva.",
        "Danos decorrentes de uso indevido, negligência ou descumprimento deste termo poderão ser apurados internamente conforme as políticas da empresa.",
        "A devolução deve ocorrer na data e no horário aprovados. Atrasos comprometem reservas seguintes e devem ser comunicados com antecedência.",
        "O equipamento deve ser devolvido limpo, com todos os acessórios e na mesma condição em que foi retirado.",
      ],
    },
    {
      title: "5. Da aprovação",
      items: [
        "A solicitação não garante a reserva: ela permanece pendente até a análise do administrador responsável.",
        "A empresa pode recusar, cancelar ou reagendar uma reserva por necessidade operacional, informando o motivo ao solicitante.",
        "O aceite deste termo é registrado com data, hora, usuário e versão do texto, e fica anexado à solicitação.",
      ],
    },
  ],
};

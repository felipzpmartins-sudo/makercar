import { env } from "../config/env.js";

type PendingReservation = {
  id: string;
  pickupDate: Date;
  returnDate: Date;
  reason: string;
  vehicle: { name: string; plate: string };
  user: { name: string; email: string; department: { name: string } | null };
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

export async function notifyHrOfPendingReservation(
  reservation: PendingReservation,
) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    console.warn(
      "Aviso de reserva pendente não enviado: configure RESEND_API_KEY e RESEND_FROM_EMAIL.",
    );
    return;
  }

  const requester = escapeHtml(reservation.user.name);
  const vehicle = escapeHtml(`${reservation.vehicle.name} (${reservation.vehicle.plate})`);
  const department = escapeHtml(reservation.user.department?.name ?? "Não informado");
  const reason = escapeHtml(reservation.reason);
  const approvalLink = env.FRONTEND_URL;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [env.HR_APPROVAL_EMAIL],
        subject: `Aprovação necessária: reserva de ${reservation.vehicle.plate}`,
        html: `
          <h2>Nova solicitação de reserva</h2>
          <p>Há uma reserva aguardando aprovação do RH.</p>
          <ul>
            <li><strong>Solicitante:</strong> ${requester} (${escapeHtml(reservation.user.email)})</li>
            <li><strong>Departamento:</strong> ${department}</li>
            <li><strong>Veículo:</strong> ${vehicle}</li>
            <li><strong>Retirada:</strong> ${formatDateTime(reservation.pickupDate)}</li>
            <li><strong>Devolução:</strong> ${formatDateTime(reservation.returnDate)}</li>
            <li><strong>Motivo:</strong> ${reason}</li>
          </ul>
          ${approvalLink ? `<p><a href="${escapeHtml(approvalLink)}">Abrir painel para analisar a solicitação</a></p>` : ""}
        `,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Resend respondeu ${response.status}: ${detail}`);
    }
  } catch (error) {
    console.error("Não foi possível enviar o aviso de reserva pendente ao RH.", error);
  }
}

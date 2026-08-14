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
  const pickupDate = formatDateTime(reservation.pickupDate);
  const returnDate = formatDateTime(reservation.returnDate);

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
        html: `<!doctype html>
          <html lang="pt-BR"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#172033">
            <div style="max-width:620px;margin:0 auto;padding:32px 16px">
              <div style="background:#0f172a;padding:24px 28px;border-radius:14px 14px 0 0;color:#ffffff">
                <div style="font-size:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#7dd3fc">MakerCar</div>
                <h1 style="font-size:24px;margin:12px 0 0">Nova reserva aguardando aprovação</h1>
              </div>
              <div style="background:#ffffff;padding:28px;border-radius:0 0 14px 14px;box-shadow:0 4px 16px rgba(15,23,42,.08)">
                <p style="font-size:16px;line-height:1.55;margin:0 0 22px">Olá, RH. Uma solicitação de veículo foi criada e precisa da sua análise.</p>
                <div style="border:1px solid #dbe4ef;border-radius:10px;overflow:hidden">
                  <div style="background:#eff6ff;padding:14px 16px;font-size:15px;font-weight:700;color:#1d4ed8">Dados da solicitação</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px">
                    <tr><td style="padding:14px 16px 6px;color:#64748b;width:38%">Solicitante</td><td style="padding:14px 16px 6px;font-weight:700">${requester}</td></tr>
                    <tr><td style="padding:6px 16px;color:#64748b">E-mail</td><td style="padding:6px 16px">${escapeHtml(reservation.user.email)}</td></tr>
                    <tr><td style="padding:6px 16px;color:#64748b">Departamento</td><td style="padding:6px 16px">${department}</td></tr>
                    <tr><td style="padding:6px 16px;color:#64748b">Veículo / placa</td><td style="padding:6px 16px;font-weight:700">${vehicle}</td></tr>
                    <tr><td style="padding:6px 16px;color:#64748b">Retirada</td><td style="padding:6px 16px">${pickupDate}</td></tr>
                    <tr><td style="padding:6px 16px;color:#64748b">Devolução</td><td style="padding:6px 16px">${returnDate}</td></tr>
                    <tr><td style="padding:6px 16px 14px;color:#64748b;vertical-align:top">Motivo</td><td style="padding:6px 16px 14px">${reason}</td></tr>
                  </table>
                </div>
                ${approvalLink ? `<div style="text-align:center;margin:26px 0 8px"><a href="${escapeHtml(approvalLink)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:8px">Abrir painel e analisar reserva</a></div>` : ""}
                <p style="color:#64748b;font-size:12px;line-height:1.5;margin:24px 0 0">Este é um aviso automático do MakerCar. A aprovação ou recusa deve ser feita no painel.</p>
              </div>
            </div>
          </body></html>`,
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

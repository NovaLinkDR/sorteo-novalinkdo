import nodemailer from "nodemailer";

/**
 * Envio de correos por SMTP (Zoho Mail para sorteo@novalinkdo.com).
 *
 * Variables de entorno:
 *   SMTP_HOST  (default smtp.zoho.com)
 *   SMTP_PORT  (default 465 -> SSL)
 *   SMTP_USER  cuenta completa, ej. sorteo@novalinkdo.com
 *   SMTP_PASS  contrasena o contrasena de aplicacion de Zoho
 *   MAIL_FROM  remitente visible (default "Sorteo NovaLink <SMTP_USER>")
 *   PUBLIC_SITE_URL  dominio publico, para armar el link de verificacion
 *
 * Si no hay credenciales, el modulo queda inactivo y avisa por consola:
 * la confirmacion de la orden NUNCA se cae por un problema de correo.
 */

const SITE = (process.env.PUBLIC_SITE_URL || "").replace(/\/$/, "");

/** Contacto visible en el correo (mismo numero que el sitio). */
const WHATSAPP_DISPLAY = "+1 809 267 7792";
const WHATSAPP_URL =
  "https://wa.me/18092677792?text=" +
  encodeURIComponent("Hola, tengo una duda sobre mi compra.");

function cfg() {
  const host = process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.MAIL_FROM || (user ? `Sorteo NovaLink <${user}>` : "");
  return { host, port, user, pass, from };
}

export function mailConfigured(): boolean {
  const { user, pass } = cfg();
  return Boolean(user && pass);
}

let cached: ReturnType<typeof nodemailer.createTransport> | null = null;
function transport(): ReturnType<typeof nodemailer.createTransport> {
  if (cached) return cached;
  const { host, port, user, pass } = cfg();
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  return cached;
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(cents: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format((Number(cents) || 0) / 100);
}

export interface MailOrder {
  code: string;
  name: string;
  email: string;
  ticket_quantity: number;
  total_cents: number;
}

export interface MailRifa {
  name: string;
  slug: string;
  prize_name?: string | null;
  sorteo_date?: string | null;
  sorteo_time?: string | null;
  sorteo_place?: string | null;
  sorteo_note?: string | null;
}

function renderHtml(
  order: MailOrder,
  rifa: MailRifa,
  tickets: string[]
): string {
  const verifyUrl = SITE ? `${SITE}/verificar` : "";
  const rowStyle =
    "padding:7px 0;border-bottom:1px solid #2a2f3a;font-size:14px;color:#c8cedb";
  const labelStyle = "color:#8b93a7;padding:7px 0;font-size:13px";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1017;font-family:Inter,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1017;padding:24px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#151a24;border:1px solid #232a38;border-radius:14px;overflow:hidden">
    <tr><td style="padding:22px 26px;background:#111621;border-bottom:1px solid #232a38">
      <div style="font-size:15px;font-weight:600;color:#ffffff">sorteo.novalink</div>
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#4ade80;margin-top:3px">Boletos confirmados</div>
    </td></tr>
    <tr><td style="padding:26px">
      <p style="margin:0 0 6px;font-size:18px;font-weight:600;color:#ffffff">¡Listo, ${esc(order.name)}! 🎉</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a9b1c2">
        Confirmamos tu pago y tus boletos ya están activos. ¡Mucha suerte!
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f141d;border:1px solid #232a38;border-radius:10px;padding:4px 18px;margin-bottom:20px">
        <tr><td style="${labelStyle}">Orden</td><td align="right" style="${rowStyle};font-family:ui-monospace,monospace"><b>${esc(order.code)}</b></td></tr>
        <tr><td style="${labelStyle}">Rifa</td><td align="right" style="${rowStyle}">${esc(rifa.name)}</td></tr>
        <tr><td style="${labelStyle}">Premio</td><td align="right" style="${rowStyle}">${esc(rifa.prize_name || "—")}</td></tr>
        <tr><td style="${labelStyle}">Cantidad</td><td align="right" style="${rowStyle}">${esc(order.ticket_quantity)} boleto(s)</td></tr>
        <tr><td style="${labelStyle}">Total</td><td align="right" style="${rowStyle}"><b style="color:#4ade80">${money(order.total_cents)}</b></td></tr>
      </table>

      <p style="margin:0 0 10px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#8b93a7">Tus números</p>
      <div style="font-family:ui-monospace,monospace;font-size:16px;color:#ffffff;line-height:1.9;background:#0f141d;border:1px solid #232a38;border-radius:10px;padding:16px 18px;word-break:break-word">
        ${tickets.map((t) => esc(t)).join(" &nbsp; ")}
      </div>

      ${
        rifa.sorteo_date || rifa.sorteo_place || rifa.sorteo_note
          ? `<p style="margin:20px 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#8b93a7">Sorteo</p>
             <p style="margin:0;font-size:14px;line-height:1.7;color:#c8cedb">
               ${[
                 rifa.sorteo_date
                   ? `${esc(rifa.sorteo_date)}${rifa.sorteo_time ? " · " + esc(rifa.sorteo_time) : ""}`
                   : "",
                 esc(rifa.sorteo_place || ""),
                 esc(rifa.sorteo_note || ""),
               ]
                 .filter(Boolean)
                 .join("<br>")}
             </p>`
          : ""
      }

      ${
        verifyUrl
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 0"><tr>
               <td style="border-radius:9px;background:#4ade80">
                 <a href="${esc(verifyUrl)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#08120a;text-decoration:none">Verificar mis boletos</a>
               </td></tr></table>`
          : ""
      }

      <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:#6f7789">
        Guarda este correo: tus números de boleto están aquí.<br>
        ¿Dudas? Responde a este mensaje o escríbenos por
        <a href="${WHATSAPP_URL}" style="color:#4ade80;text-decoration:none">WhatsApp (${WHATSAPP_DISPLAY})</a>.
      </p>
    </td></tr>
    <tr><td style="padding:16px 26px;background:#111621;border-top:1px solid #232a38">
      <div style="font-size:11px;color:#6f7789;line-height:1.7">
        Sorteo NovaLink · Juego responsable +18 · Solo adultos<br>
        Este correo se envió a ${esc(order.email)}
      </div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function renderText(
  order: MailOrder,
  rifa: MailRifa,
  tickets: string[]
): string {
  return [
    "sorteo.novalink — BOLETOS CONFIRMADOS",
    "",
    `¡Listo, ${order.name}! Confirmamos tu pago y tus boletos ya están activos.`,
    "",
    `Orden      : ${order.code}`,
    `Rifa       : ${rifa.name}`,
    `Premio     : ${rifa.prize_name || "-"}`,
    `Cantidad   : ${order.ticket_quantity} boleto(s)`,
    `Total      : ${money(order.total_cents)}`,
    "",
    `Tus números: ${tickets.join(" ")}`,
    "",
    rifa.sorteo_date
      ? `Sorteo: ${rifa.sorteo_date}${rifa.sorteo_time ? " " + rifa.sorteo_time : ""}${rifa.sorteo_place ? " — " + rifa.sorteo_place : ""}`
      : "",
    SITE ? `Verifica tus boletos: ${SITE}/verificar` : "",
    "",
    `¿Dudas? WhatsApp: https://wa.me/18092677792  (${WHATSAPP_DISPLAY})`,
    "",
    "Juego responsable +18 · Solo adultos",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * Envía la confirmación de una orden ya confirmada.
 * Lanza si falla; quien llama decide si lo registra o lo ignora.
 */
export async function sendOrderConfirmation(
  order: MailOrder,
  rifa: MailRifa,
  tickets: string[]
): Promise<void> {
  const { from } = cfg();
  if (!mailConfigured()) {
    console.warn("[mail] SMTP sin configurar: no se envió la confirmación de", order.code);
    return;
  }
  const info = await transport().sendMail({
    from,
    to: order.email,
    replyTo: from,
    subject: `✅ Boletos confirmados — ${rifa.name} (${order.code})`,
    text: renderText(order, rifa, tickets),
    html: renderHtml(order, rifa, tickets),
  });
  console.log(`[mail] confirmación ${order.code} enviada a ${order.email} (id=${info.messageId})`);
}

/**
 * Formulaire de contact → API Noctalis.
 * Même logique que scripts/html/site.js (site statique exporté) : à garder synchronisés.
 * Le destinataire est configuré côté API pour ce siteId ; aucun secret ni adresse de réception ici.
 */
export const CONTACT_API = "https://api.noctalis.digital/v1/emails/send";
export const CONTACT_SITE_ID = "muriel-calas";

export type ContactData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile: string;
  subject: string;
  message: string;
};

/** Validation stricte : l’adresse sert aussi de « répondre à » */
export function isEmail(value: string): boolean {
  const v = String(value || "").trim();
  if (v.length > 254 || /\.\./.test(v)) return false;
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(v);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const multiline = (value: string) =>
  escapeHtml(String(value || "").replace(/\r\n?/g, "\n").trim()).replace(/\n/g, "<br>");

export function readContact(data: FormData): ContactData {
  const v = (n: string) => String(data.get(n) ?? "").trim();
  return {
    firstName: v("firstName"),
    lastName: v("lastName"),
    email: v("email"),
    phone: v("phone"),
    profile: v("profile"),
    subject: v("subject"),
    message: String(data.get("message") ?? ""),
  };
}

/** E-mail reçu par Muriel : tableaux, styles en ligne, aux couleurs du site */
export function buildContactEmail(c: ContactData): string {
  const ink = "#0d1b2a", muted = "#4a5b6d", clay = "#a8552f", paper = "#faf7f2", line = "#e6e0d6";
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const name = `${c.firstName} ${c.lastName}`.trim();
  const row = (label: string, html: string) =>
    `<tr><td style="padding:14px 0;border-top:1px solid ${line};font-family:${sans};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${muted};width:34%;vertical-align:top;">${label}</td>` +
    `<td style="padding:14px 0;border-top:1px solid ${line};font-family:${sans};font-size:15px;line-height:1.5;color:${ink};vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${html}</td></tr>`;
  const phoneDigits = c.phone.replace(/[^\d+]/g, "");
  const rows =
    row("Nom", escapeHtml(name)) +
    row("E-mail", `<a href="mailto:${escapeHtml(c.email)}" style="color:${ink};">${escapeHtml(c.email)}</a>`) +
    (c.phone
      ? row("Téléphone", phoneDigits ? `<a href="tel:${escapeHtml(phoneDigits)}" style="color:${ink};">${escapeHtml(c.phone)}</a>` : escapeHtml(c.phone))
      : "") +
    (c.profile ? row("Profil", escapeHtml(c.profile)) : "") +
    (c.subject ? row("Sujet", escapeHtml(c.subject)) : "");

  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nouvelle demande de contact</title></head>` +
    `<body style="margin:0;padding:0;background:${paper};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${paper};"><tr><td align="center" style="padding:28px 12px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ${line};border-radius:8px;">` +
    `<tr><td style="padding:28px 32px 22px;border-bottom:3px solid ${clay};">` +
    `<div style="font-family:${serif};font-size:22px;color:${ink};">Muriel Calas</div>` +
    `<div style="font-family:${sans};font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${muted};margin-top:4px;">Préparatrice mentale</div></td></tr>` +
    `<tr><td style="padding:28px 32px 8px;">` +
    `<div style="font-family:${sans};font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${clay};">Nouvelle demande de contact</div>` +
    `<h1 style="margin:10px 0 18px;font-family:${serif};font-weight:400;font-size:26px;line-height:1.2;word-break:break-word;color:${ink};">${escapeHtml(name)}</h1>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>` +
    `<tr><td style="padding:12px 32px 28px;">` +
    `<div style="font-family:${sans};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${muted};margin-bottom:10px;">Message</div>` +
    `<div style="font-family:${sans};font-size:15px;line-height:1.65;color:${ink};background:${paper};border-left:3px solid ${clay};padding:16px 18px;border-radius:4px;word-break:break-word;overflow-wrap:anywhere;">${multiline(c.message)}</div></td></tr>` +
    `<tr><td style="padding:18px 32px 26px;border-top:1px solid ${line};font-family:${sans};font-size:13px;line-height:1.5;color:${muted};">` +
    `Pour répondre, utilisez simplement « Répondre » : votre réponse partira à ${escapeHtml(c.email)}.<br>` +
    `Message envoyé depuis le formulaire de contact de www.muriel-calas.fr. La personne a accepté le traitement de ses données pour cette demande.</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}

export function contactPayload(c: ContactData) {
  const name = `${c.firstName} ${c.lastName}`.replace(/[\r\n]+/g, " ").trim();
  const topic = c.subject ? `${c.subject.replace(/[\r\n]+/g, " ")} · ` : "";
  return {
    siteId: CONTACT_SITE_ID,
    subject: `Nouvelle demande de contact · ${topic}${name}`,
    html: buildContactEmail(c),
    ...(isEmail(c.email) ? { replyTo: c.email.trim() } : {}),
  };
}

export async function sendContact(c: ContactData): Promise<void> {
  const response = await fetch(CONTACT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contactPayload(c)),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success === false) {
    throw new Error(result?.error?.message ?? "Unable to send email");
  }
}

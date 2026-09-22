import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

// VOYE IMÈL SOU NON NOUIE
//
// Nou pase pa bwat imèl Hostinger `support@no-uie.com` la (SMTP). Pa gen okenn
// lòt sèvis: se menm bwat kote repons kliyan yo tounen. Supabase bloke pò 25
// ak 587 nan Edge Functions — 465 (TLS dirèk) pase, se sa Hostinger sèvi.
//
// Sekrè yo (supabase secrets set):
//   SMTP_HOST=smtp.hostinger.com  SMTP_PORT=465
//   SMTP_USER=franckley@no-uie.com   (bwat ki konekte a)
//   SMTP_PASS=<modpas bwat la>
//   MAIL_FROM=support@no-uie.com     (alyas kliyan an wè; opsyonèl)
//   MAIL_FROM_NAME=NOUIE             (opsyonèl)

export interface Mail {
  to: string
  subject: string
  text: string
  html: string
}

export type MailResult = { ok: true } | { ok: false; error: string }

const cfg = () => ({
  host: (Deno.env.get("SMTP_HOST") || "").trim(),
  port: Number(Deno.env.get("SMTP_PORT") || 465),
  user: (Deno.env.get("SMTP_USER") || "").trim(),
  pass: Deno.env.get("SMTP_PASS") || "",
  fromName: (Deno.env.get("MAIL_FROM_NAME") || "NOUIE").trim(),
  fromAddr: (Deno.env.get("MAIL_FROM") || Deno.env.get("SMTP_USER") || "").trim(),
})

export const smtpConfigured = () => {
  const c = cfg()
  return Boolean(c.host && c.user && c.pass)
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const c = cfg()
  if (!c.host || !c.user || !c.pass) return { ok: false, error: "SMTP_PA_KONFIGIRE" }

  // Destinatè a ak sijè a ka soti nan men yon kliyan (checkout, fòm kontak).
  // Yon \r\n ladan yo ta ka ajoute antèt imèl (Bcc: ...) — nou refize/netwaye.
  const to = mail.to.trim()
  if (/[\r\n,;<>\s]/.test(to) || !/^[^@]+@[^@]+\.[^@]+$/.test(to)) return { ok: false, error: "DESTINATÈ_ENVALID" }
  const subject = mail.subject.replace(/[\r\n]+/g, " ").slice(0, 200)

  // Kliyan an wè alyas la (support@). Si Hostinger refize voye sou non
  // alyas la, nou reseye ak bwat ki konekte a olye kliyan an pa resevwa anyen.
  const first = await sendOnce(c, c.fromAddr, to, subject, mail)
  if (first.ok || c.fromAddr.toLowerCase() === c.user.toLowerCase()) return first
  console.warn(`Voye sou non ${c.fromAddr} echwe (${first.error}) — reseye ak ${c.user}`)
  const second = await sendOnce(c, c.user, to, subject, mail)
  return second.ok ? second : first
}

async function sendOnce(c: ReturnType<typeof cfg>, from: string, to: string, subject: string, mail: Mail): Promise<MailResult> {
  const client = new SMTPClient({
    connection: {
      hostname: c.host,
      port: c.port,
      // 465 = TLS dirèk. SMTP_TLS=1 fòse TLS sou yon lòt pò (tès, lòt lame).
      tls: c.port === 465 || Deno.env.get("SMTP_TLS") === "1",
      auth: { username: c.user, password: c.pass },
    },
  })

  try {
    await client.send({
      from: `${c.fromName} <${from}>`,
      to,
      replyTo: c.fromAddr,
      subject,
      content: mail.text,
      html: mail.html,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String((err as Error)?.message || err).slice(0, 500) }
  } finally {
    try { await client.close() } catch { /* koneksyon an deja fèmen */ }
  }
}

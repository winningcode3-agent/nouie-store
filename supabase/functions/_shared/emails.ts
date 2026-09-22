import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import { sendMail, type Mail, type MailResult } from "./mail.ts"

// TWA IMÈL BOUTIK LA
//
//   order_confirmation — otomatik lè Stripe konfime peman an (stripe-webhook)
//   shipped            — lè admin lan make kòmand lan SHIPPED ak yon tracking
//   reply              — repons admin lan ekri nan SUPPORT_MESSAGES
//
// Chak imèl ekri nan `email_log` ANVAN li pati (status=pending), epi li vin
// `sent` oswa `failed`. Konsa panèl la montre verite a, epi yon webhook Stripe
// ki rive de fwa pa voye de konfimasyon (endèks inik sou kòmand lan).
//
// Tout sa kliyan an te tape (non, adrès, mesaj) chape nan HTML la.

const SITE = (Deno.env.get("SITE_URL") || "https://no-uie.com").replace(/\/+$/, "")

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

const usd = (n: unknown) => `$${Number(n || 0).toFixed(2)}`

const TRACKING_URL: Record<string, (n: string) => string> = {
  UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  FEDEX: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL: (n) => `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(n)}`,
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
}

export const trackingUrl = (carrier: string, number: string) =>
  TRACKING_URL[String(carrier || "").toUpperCase()]?.(number) || ""

interface Business {
  name?: string
  email_support?: string
  phone?: string
  address_line1?: string
  city?: string
  state?: string
  zip?: string
}

async function getBusiness(db: SupabaseClient): Promise<Business> {
  const { data } = await db.from("store_settings").select("value").eq("key", "business").maybeSingle()
  return (data?.value as Business) || {}
}

// Ankadreman komen: nwa/blan, tipografi NOUIE, lajè imèl estanda.
function layout(title: string, inner: string, biz: Business): string {
  const name = esc(biz.name || "NOUIE")
  const contact = [biz.email_support, biz.phone].filter(Boolean).map(esc).join(" · ")
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;font-family:Helvetica,Arial,sans-serif;color:#000;">
<tr><td style="padding:28px 32px;border-bottom:1px solid #e5e5e5;">
  <div style="font-size:26px;font-weight:900;line-height:0.95;color:#E30613;letter-spacing:-0.5px;">NO<br>&nbsp;UIE</div>
</td></tr>
<tr><td style="padding:32px;">
  <h1 style="margin:0 0 20px;font-size:22px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">${esc(title)}</h1>
  ${inner}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e5e5;font-size:12px;line-height:1.6;color:#666;">
  ${name}${contact ? ` · ${contact}` : ""}<br>
  <a href="${SITE}" style="color:#000;">${SITE.replace(/^https?:\/\//, "")}</a> ·
  <a href="${SITE}/#returns" style="color:#000;">Refund policy</a> ·
  <a href="${SITE}/#shipping" style="color:#000;">Shipping policy</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${html}</p>`

function orderTable(order: any): { html: string; text: string } {
  const items: any[] = Array.isArray(order.items) ? order.items : []
  const rows = items.map((it) => {
    const qty = Number(it.qty ?? it.quantity ?? 1)
    const line = Number(it.price || 0) * qty
    return {
      html: `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">${esc(it.name)}${it.size ? ` — ${esc(it.size)}` : ""} × ${qty}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;">${usd(line)}</td></tr>`,
      text: `${it.name}${it.size ? ` — ${it.size}` : ""} x ${qty}   ${usd(line)}`,
    }
  })
  const totals: [string, string][] = [["Subtotal", usd(order.subtotal)]]
  if (Number(order.discount_amount) > 0) totals.push([`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`, `-${usd(order.discount_amount)}`])
  totals.push([`Shipping${order.shipping_method ? ` (${order.shipping_method})` : ""}`, usd(order.shipping_cost)])
  if (Number(order.tax_amount) > 0) totals.push(["Tax", usd(order.tax_amount)])

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    ${rows.map((r) => r.html).join("")}
    ${totals.map(([k, v]) => `<tr><td style="padding:6px 0;font-size:14px;color:#666;">${esc(k)}</td><td align="right" style="padding:6px 0;font-size:14px;color:#666;">${esc(v)}</td></tr>`).join("")}
    <tr><td style="padding:10px 0;font-size:16px;font-weight:900;border-top:2px solid #000;">TOTAL</td>
        <td align="right" style="padding:10px 0;font-size:16px;font-weight:900;border-top:2px solid #000;">${usd(order.total)}</td></tr>
  </table>`
  const text = [...rows.map((r) => r.text), "", ...totals.map(([k, v]) => `${k}: ${v}`), `TOTAL: ${usd(order.total)}`].join("\n")
  return { html, text }
}

export function buildOrderConfirmation(order: any, biz: Business): Mail {
  const t = orderTable(order)
  const first = String(order.customer_name || "").trim().split(/\s+/)[0]
  const inner = [
    p(`${first ? `Hi ${esc(first)}, t` : "T"}hank you for your order. Your payment was received and we are preparing your package.`),
    p(`<strong>ORDER #${esc(order.id)}</strong>`),
    t.html,
    order.shipping_address ? p(`<strong>Shipping to</strong><br>${esc(order.shipping_address).replace(/\n/g, "<br>")}`) : "",
    p(`We will email you a tracking number as soon as your order ships.`),
    p(`<strong>All sales are final.</strong> If your item arrives defective, damaged or wrong, simply reply to this email right away and we will make it right.`),
  ].join("")
  return {
    to: order.customer_email,
    subject: `${biz.name || "NOUIE"} — Order #${order.id} confirmed`,
    html: layout("Order confirmed", inner, biz),
    text: [
      `Thank you for your order. Your payment was received and we are preparing your package.`,
      ``, `ORDER #${order.id}`, t.text, ``,
      order.shipping_address ? `Shipping to:\n${order.shipping_address}\n` : "",
      `We will email you a tracking number as soon as your order ships.`,
      `All sales are final. If your item arrives defective, damaged or wrong, reply to this email right away.`,
      ``, SITE,
    ].join("\n"),
  }
}

export function buildShipped(order: any, biz: Business): Mail {
  const url = trackingUrl(order.carrier, order.tracking_number)
  const inner = [
    p(`Good news — your order <strong>#${esc(order.id)}</strong> is on its way.`),
    p(`<strong>${esc(order.carrier || "Carrier")}</strong> tracking number:<br><span style="font-size:18px;font-weight:900;letter-spacing:1px;">${esc(order.tracking_number)}</span>`),
    url ? `<p style="margin:20px 0;"><a href="${esc(url)}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 26px;font-weight:900;letter-spacing:2px;font-size:13px;">TRACK MY ORDER</a></p>` : "",
    p(`Tracking can take up to 48 hours to show movement. Questions? Just reply to this email.`),
  ].join("")
  return {
    to: order.customer_email,
    subject: `${biz.name || "NOUIE"} — Order #${order.id} has shipped`,
    html: layout("Your order has shipped", inner, biz),
    text: [
      `Your order #${order.id} is on its way.`,
      `${order.carrier || "Carrier"} tracking number: ${order.tracking_number}`,
      url ? `Track it: ${url}` : "",
      `Tracking can take up to 48 hours to show movement. Questions? Just reply to this email.`,
      ``, SITE,
    ].join("\n"),
  }
}

export function buildReply(msg: any, body: string, biz: Business): Mail {
  const first = String(msg.name || "").trim().split(/\s+/)[0]
  const quoted = String(msg.message || "")
  const inner = [
    first ? p(`Hi ${esc(first)},`) : "",
    `<div style="font-size:15px;line-height:1.6;white-space:pre-wrap;margin:0 0 24px;">${esc(body)}</div>`,
    `<div style="border-left:3px solid #ddd;padding:4px 0 4px 14px;color:#666;font-size:13px;line-height:1.5;white-space:pre-wrap;">${esc(quoted)}</div>`,
  ].join("")
  const subject = msg.subject ? `Re: ${String(msg.subject)}` : `Re: your message to ${biz.name || "NOUIE"}`
  return {
    to: msg.email,
    subject,
    html: layout(biz.name || "NOUIE", inner, biz),
    text: [first ? `Hi ${first},\n` : "", body, "", "— Your message:", quoted.split("\n").map((l) => `> ${l}`).join("\n")].join("\n"),
  }
}

// Ekri nan jounal la → voye → make rezilta a. `claimError` = yon lòt apèl te
// deja reklame menm konfimasyon otomatik la (webhook doub) — nou pa voye.
async function logAndSend(
  db: SupabaseClient,
  mail: Mail,
  meta: { kind: string; auto?: boolean; order_id?: number; message_id?: number },
): Promise<MailResult & { log_id?: number; skipped?: boolean }> {
  const { data: row, error: claimError } = await db
    .from("email_log")
    .insert({ ...meta, auto: meta.auto ?? false, to_email: mail.to, subject: mail.subject, body: mail.text, status: "pending" })
    .select("id")
    .single()

  if (claimError) {
    if (claimError.code === "23505") return { ok: true, skipped: true }
    return { ok: false, error: `EMAIL_LOG: ${claimError.message}` }
  }

  const res = await sendMail(mail)
  await db
    .from("email_log")
    .update(res.ok ? { status: "sent", sent_at: new Date().toISOString() } : { status: "failed", error: res.error })
    .eq("id", row.id)
  return { ...res, log_id: row.id }
}

export async function sendOrderConfirmation(db: SupabaseClient, orderId: number, auto: boolean) {
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle()
  if (!order?.customer_email) return { ok: false as const, error: "KÒMAND_PA_JWENN" }
  return logAndSend(db, buildOrderConfirmation(order, await getBusiness(db)), { kind: "order_confirmation", auto, order_id: orderId })
}

export async function sendShipped(db: SupabaseClient, orderId: number) {
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle()
  if (!order?.customer_email) return { ok: false as const, error: "KÒMAND_PA_JWENN" }
  if (!order.tracking_number) return { ok: false as const, error: "PA_GEN_TRACKING" }
  return logAndSend(db, buildShipped(order, await getBusiness(db)), { kind: "shipped", order_id: orderId })
}

export async function sendReply(db: SupabaseClient, messageId: number, body: string) {
  const { data: msg } = await db.from("contact_messages").select("*").eq("id", messageId).maybeSingle()
  if (!msg?.email) return { ok: false as const, error: "MESAJ_PA_JWENN" }
  return logAndSend(db, buildReply(msg, body, await getBusiness(db)), { kind: "reply", message_id: messageId })
}

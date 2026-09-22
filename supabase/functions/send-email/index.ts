import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { sendOrderConfirmation, sendReply, sendShipped } from "../_shared/emails.ts"
import { smtpConfigured } from "../_shared/mail.ts"

// IMÈL ADMIN LAN VOYE SOU NON NOUIE
//
//   { action: "reply", message_id, body }        — repons nan SUPPORT_MESSAGES
//   { action: "shipped", order_id }              — lè kòmand lan pase SHIPPED
//   { action: "order_confirmation", order_id }   — revoye konfimasyon an
//
// Sèl yon admin ki nan tab `admins` ka rele l. Destinatè a pa janm soti nan
// navigatè a: se imèl kòmand lan oswa mesaj la nan baz la — donk menm yon
// sesyon admin vòlè pa ka sèvi fonksyon sa a pou voye imèl bay nenpòt moun.

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const siteUrl = (Deno.env.get("SITE_URL") || "https://no-uie.com").replace(/\/+$/, "")

// Sit la + panèl la sou machin lokal (vite dev). CORS pa yon baryè sekirite
// isit la — se jeton admin lan ki pwoteje fonksyon an; sa a jis kite
// navigatè a pase repons lan bay paj ki mande l.
const origin = (req: Request) => {
  const o = req.headers.get("Origin") || ""
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o) ? o : siteUrl
}

const corsFor = (req: Request) => ({
  "Access-Control-Allow-Origin": origin(req),
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
})

serve(async (req: Request) => {
  const corsHeaders = corsFor(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "METÒD_ENVALID" }, 405)

  const db = createClient(supabaseUrl, serviceRoleKey)

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim()
  if (!token) return json({ error: "AKSE_REFIZE" }, 401)
  const { data: userData, error: userErr } = await db.auth.getUser(token)
  const callerEmail = userData?.user?.email?.toLowerCase().trim()
  if (userErr || !callerEmail) return json({ error: "AKSE_REFIZE" }, 401)
  const { data: callerAdmin } = await db.from("admins").select("id").eq("email", callerEmail).maybeSingle()
  if (!callerAdmin) return json({ error: "AKSE_REFIZE" }, 403)

  if (!smtpConfigured()) return json({ error: "SMTP_PA_KONFIGIRE" }, 503)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: "KÒ_ENVALID" }, 400)
  }

  const action = String(body?.action || "")
  let res: { ok: boolean; error?: string }

  if (action === "reply") {
    const text = String(body?.body || "").trim()
    if (!text) return json({ error: "REPONS_VID" }, 400)
    if (text.length > 5000) return json({ error: "REPONS_TWÒ_LONG" }, 400)
    res = await sendReply(db, Number(body?.message_id), text)
  } else if (action === "shipped") {
    res = await sendShipped(db, Number(body?.order_id))
  } else if (action === "order_confirmation") {
    res = await sendOrderConfirmation(db, Number(body?.order_id), false)
  } else {
    return json({ error: "AKSYON_ENKONI" }, 400)
  }

  return res.ok ? json({ ok: true }) : json({ error: res.error || "ECHÈK_IMÈL" }, 502)
})

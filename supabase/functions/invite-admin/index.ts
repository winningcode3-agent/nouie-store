import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

// VRÈ ENVITASYON ADMIN
//
// Anvan fonksyon sa a, bouton « INVITE NEW ADMINISTRATOR » nan panèl la te
// senpman antre yon imèl nan tab `admins`. Okenn imèl pa t pati, okenn kont
// pa t kreye — donk moun nan pa t ka konekte ditou, sof si yon moun te kreye
// kont li alamen nan Supabase epi voye yon modpas ba li pa deyò.
//
// Kounye a: Supabase voye yon vrè imèl envitasyon, moun nan klike sou lyen an
// epi li chwazi modpas pa l. Nou pa janm manyen modpas la.
//
// Sekirite: sèl yon admin ki deja nan tab `admins` ki ka envite. Nou verifye
// jeton an sou sèvè a — nou pa fè konfyans nan anyen navigatè a di.

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const siteUrl = (Deno.env.get("SITE_URL") || "https://no-uie.com").replace(/\/+$/, "")

const corsHeaders = {
  "Access-Control-Allow-Origin": siteUrl,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "METÒD_ENVALID" }, 405)

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // 1. Ki moun k ap mande? Jeton an dwe pwouve l, pa kò rekèt la.
  const authHeader = req.headers.get("Authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  if (!token) return json({ error: "AKSE_REFIZE" }, 401)

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  const callerEmail = userData?.user?.email?.toLowerCase().trim()
  if (userErr || !callerEmail) return json({ error: "AKSE_REFIZE" }, 401)

  const { data: callerAdmin } = await admin
    .from("admins")
    .select("id")
    .eq("email", callerEmail)
    .maybeSingle()

  if (!callerAdmin) return json({ error: "AKSE_REFIZE" }, 403)

  // 2. Imèl ki pral envite a
  let email = ""
  try {
    const body = await req.json()
    email = String(body?.email || "").toLowerCase().trim()
  } catch {
    return json({ error: "KÒ_ENVALID" }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "IMÈL_ENVALID" }, 400)

  const { data: deja } = await admin.from("admins").select("id").eq("email", email).maybeSingle()
  if (deja) return json({ error: "DEJA_ADMIN" }, 409)

  // 3. Envitasyon an. Si moun nan gen yon kont deja, Supabase bay yon erè —
  //    nan ka sa a nou jis otorize l (li konnen modpas li deja).
  let envite = true
  // Redireksyon an ale sou rasin sit la, PA sou `/#admin`. Supabase kole pwòp
  // paramèt li yo nan fragman an (`#access_token=...&type=invite`); si nou mete
  // yon hash nou menm, de fragman yo antre youn nan lòt epi lyen an kraze.
  // Paj la detekte `type=invite` epi li mennen moun nan sou ekran « chwazi
  // modpas » la.
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/`,
  })

  if (inviteErr) {
    const msg = String(inviteErr.message || "").toLowerCase()
    const dejaGenKont = msg.includes("already been registered") || msg.includes("already exists")
    if (!dejaGenKont) {
      console.error("Echèk envitasyon:", inviteErr.message)
      return json({ error: "ECHÈK_ENVITASYON", detay: inviteErr.message }, 500)
    }
    envite = false
  }

  // 4. Otorizasyon an. Si sa a echwe apre imèl la pati, moun nan ap gen yon kont
  //    san dwa — donk nou di l klèman olye nou fè konprann tout bagay bon.
  const { error: insErr } = await admin.from("admins").insert({ email })
  if (insErr) {
    console.error("Imèl envitasyon pati men otorizasyon an echwe:", insErr.message)
    return json({ error: "ENVITE_MEN_PA_OTORIZE", detay: insErr.message }, 500)
  }

  return json({
    ok: true,
    email,
    envitasyon_voye: envite,
    mesaj: envite
      ? "Envitasyon voye. Moun nan ap chwazi modpas pa l sou lyen an."
      : "Moun nan te gen yon kont deja — li otorize kounye a, li konekte ak modpas li.",
  })
})

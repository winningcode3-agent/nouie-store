import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "npm:stripe@17"
import { createClient } from "npm:@supabase/supabase-js@2"

// Retire tout espas blan — gade nòt nan create-checkout-session.
const stripeSecretKey = (Deno.env.get("STRIPE_SECRET_KEY") || "").replace(/\s+/g, "")
const stripeWebhookSecret = (Deno.env.get("STRIPE_WEBHOOK_SECRET") || "").replace(/\s+/g, "")
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

// Menm rezon ak create-checkout-session: fetch() se sèl chemen rezo nan
// izolan Edge la. (Verifikasyon siyati a se pi ba, ak SubtleCryptoProvider.)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia" as any,
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature || !stripeWebhookSecret) {
    console.error("Manke stripe-signature oswa STRIPE_WEBHOOK_SECRET")
    return new Response(JSON.stringify({ error: "Manke siyati" }), { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await req.text()
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      stripeWebhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider() as any
    )
  } catch (err: any) {
    console.error("Echèk verifikasyon siyati webhook:", err?.message)
    return new Response(JSON.stringify({ error: "Siyati envalid" }), { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderIdStr = session.client_reference_id || session.metadata?.order_id

        if (!orderIdStr) {
          console.warn("checkout.session.completed san client_reference_id ni metadata.order_id")
          return new Response(JSON.stringify({ received: true }), { status: 200 })
        }

        const orderId = Number(orderIdStr)

        // 1. Rekipere kòmand lan nan DB
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .select("id, status, total, stripe_session_id")
          .eq("id", orderId)
          .single()

        if (orderErr || !order) {
          console.error(`Kòmand #${orderId} pa jwenn nan DB:`, orderErr)
          return new Response(JSON.stringify({ error: "Kòmand pa jwenn" }), { status: 500 })
        }

        // Idempotans: Si li deja trete (pa pending), pa refè anyen
        if (order.status !== "pending") {
          console.log(`Kòmand #${orderId} deja nan estati '${order.status}'. Idempotan OK.`)
          return new Response(JSON.stringify({ received: true, already_processed: true }), { status: 200 })
        }

        // 2. Verifye si peman an konplè epi si montan ak deviz matche egzakteman
        const expectedCents = Math.round(Number(order.total) * 100)
        const isPaid = session.payment_status === "paid"
        const isUsd = (session.currency || "").toLowerCase() === "usd"
        const isAmountMatch = session.amount_total === expectedCents

        if (!isPaid || !isUsd || !isAmountMatch) {
          console.error(
            `DEKALAJ PEMAN sou kòmand #${orderId}! payment_status=${session.payment_status}, currency=${session.currency}, amount_total=${session.amount_total}, expected=${expectedCents}`
          )
          // Make li payment_review pou admin ka enspekte l
          await supabase
            .from("orders")
            .update({
              status: "payment_review",
              stripe_session_id: session.id,
            })
            .eq("id", orderId)

          return new Response(JSON.stringify({ received: true, flagged: "payment_review" }), { status: 200 })
        }

        // 3. Tout bagay kòrèk: Make kòmand lan 'paid'
        const { error: paidErr } = await supabase
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
          })
          .eq("id", orderId)
          .eq("status", "pending")

        if (paidErr) {
          console.error(`Erè aktyalizasyon paid sou kòmand #${orderId}:`, paidErr)
          return new Response(JSON.stringify({ error: "Echèk aktyalizasyon" }), { status: 500 })
        }

        console.log(`Kòmand #${orderId} make 'paid' avèk siksè!`)
        return new Response(JSON.stringify({ received: true, status: "paid" }), { status: 200 })
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderIdStr = session.client_reference_id || session.metadata?.order_id

        if (orderIdStr) {
          const orderId = Number(orderIdStr)

          // Sèlman yon kòmand ki toujou 'pending' gen dwa restoke.
          // San tchèk sa a, yon evènman 'expired' sou yon kòmand deja PEYE ta
          // remèt estòk la epi make kòmand lan 'cancelled' — peman an vin envizib.
          const { data: order } = await supabase
            .from("orders")
            .select("id, status")
            .eq("id", orderId)
            .maybeSingle()

          if (!order) {
            console.warn(`Sesyon ekspire pou kòmand #${orderId} ki pa jwenn nan DB.`)
          } else if (order.status !== "pending") {
            console.log(`Sesyon ekspire pou kòmand #${orderId} nan estati '${order.status}' — pa touche.`)
          } else {
            console.log(`Sesyon Stripe ekspire pou kòmand #${orderId}. Rele cancel_order pou remèt estòk...`)
            // cancel_order sèvi service_role kounye a gras ak migrasyon 0012
            const { error: cancelErr } = await supabase.rpc("cancel_order", { p_order_id: orderId })
            if (cancelErr) {
              console.warn(`cancel_order sou sesyon ekspire #${orderId}:`, cancelErr.message)
            }
          }
        }
        return new Response(JSON.stringify({ received: true, action: "restocked" }), { status: 200 })
      }

      default:
        // Inyore lòt evènman Stripe ak 200
        return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200 })
    }
  } catch (err: any) {
    console.error("Erè entèn nan webhook handler:", err)
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 })
  }
})

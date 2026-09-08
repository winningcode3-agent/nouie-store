import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "npm:stripe@17"
import { createClient } from "npm:@supabase/supabase-js@2"

// Retire TOUT espas blan: yon kle ki kole depi yon mesaj vlope pote \n nan mitan l,
// sa bay yon antèt HTTP envalid epi stripe-node rapòte l kòm erè koneksyon.
// Yon vrè kle Stripe pa janm gen espas, donk sa a san danje.
const stripeSecretKey = (Deno.env.get("STRIPE_SECRET_KEY") || "").replace(/\s+/g, "")
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const siteUrl = (Deno.env.get("SITE_URL") || "https://no-uie.com").replace(/\/+$/, "")

// httpClient OBLIGATWA sou Supabase Edge Runtime: kliyan defo stripe-node an
// sèvi modil `node:https`, ki pa gen sokèt nan izolan Deno a → StripeConnectionError.
// createFetchHttpClient() sèvi fetch(), sèl chemen rezo ki disponib la.
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia" as any,
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": siteUrl,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const body = await req.json()
    const {
      p_customer_name,
      p_customer_email,
      p_customer_phone,
      p_shipping_address,
      p_notes,
      p_items,
      p_shipping_method,
      p_discount_code,
      previous_order_id,
    } = body

    // 1. Si gen yon previous_order_id ki te pending, libere estòk li anvan nou kreye nouvo.
    //    Imèl la dwe matche: san sa nenpòt moun ta ka anile kòmand nenpòt lòt kliyan
    //    (id yo se BIGSERIAL, fasil pou devine).
    if (previous_order_id) {
      try {
        const { data: prevOrder } = await supabase
          .from("orders")
          .select("id, status, stripe_session_id, customer_email")
          .eq("id", previous_order_id)
          .eq("customer_email", String(p_customer_email || "").trim())
          .maybeSingle()

        if (prevOrder && prevOrder.status === "pending") {
          await supabase.rpc("cancel_order", { p_order_id: previous_order_id })
          if (prevOrder.stripe_session_id && stripeSecretKey) {
            await stripe.checkout.sessions.expire(prevOrder.stripe_session_id).catch(() => {})
          }
        }
      } catch (err) {
        console.warn("Erè pandan anile previous_order_id:", err)
      }
    }

    // 2. Rele place_order dirèkteman sou sèvè a (atomik, dedwi estòk)
    const { data: orderId, error: placeError } = await supabase.rpc("place_order", {
      p_customer_name: p_customer_name || "",
      p_customer_email: p_customer_email || "",
      p_customer_phone: p_customer_phone || "",
      p_shipping_address: p_shipping_address || "",
      p_notes: p_notes || "",
      p_items: p_items || [],
      p_shipping_method: p_shipping_method || "standard",
      p_discount_code: p_discount_code || null,
    })

    if (placeError) {
      return new Response(JSON.stringify({ error: placeError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 3. Rekipere vrè total ak detay kòmand lan nan baz done a (jamè nan kliyan)
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, total, items, customer_email, customer_name")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      // Si nou pa jwenn kòmand lan, remèt estòk la imedyatman
      await supabase.rpc("cancel_order", { p_order_id: orderId })
      return new Response(JSON.stringify({ error: "KOMAND_PA_JWENN_APRE_KREYASYON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Rezime atik yo pou Stripe Checkout
    const itemsSummary = Array.isArray(order.items)
      ? order.items.map((it: any) => `${it.name} (${it.size || "STD"}) × ${it.qty}`).join(", ")
      : `Order #${order.id}`

    // 4. Kreye sesyon Stripe Checkout la
    let session: Stripe.Checkout.Session
    try {
      const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60) // 30 minit
      const unitAmount = Math.round(Number(order.total) * 100)

      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: order.customer_email,
        client_reference_id: String(order.id),
        metadata: {
          order_id: String(order.id),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: unitAmount,
              product_data: {
                name: `NOUIE — Order #${order.id}`,
                description: itemsSummary.slice(0, 500),
              },
            },
          },
        ],
        expires_at: expiresAt,
        success_url: `${siteUrl}/#order/success`,
        cancel_url: `${siteUrl}/#order/cancel`,
      })
    } catch (stripeErr: any) {
      console.error("Erè kreyasyon Stripe session:", stripeErr)
      // Libere estòk la imedyatman si Stripe echwe
      await supabase.rpc("cancel_order", { p_order_id: orderId })
      return new Response(JSON.stringify({ error: `STRIPE_ERROR: ${stripeErr?.message || "Echèk sesyon"}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 5. Mete ajou stripe_session_id sou kòmand lan
    const { error: updateError } = await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId)

    if (updateError) {
      console.error("Erè aktyalizasyon stripe_session_id:", updateError)
    }

    // 6. Retounen URL Stripe la ak order_id bay kliyan an
    return new Response(
      JSON.stringify({
        url: session.url,
        order_id: order.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (err: any) {
    console.error("Erè sèvè jeneral:", err)
    return new Response(JSON.stringify({ error: err?.message || "Erè entèn" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

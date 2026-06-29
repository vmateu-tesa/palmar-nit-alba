// =====================================================================
// PalmAR — Edge Function: create-checkout
// Crea una palmera pendiente de pago y una sesión de Stripe Checkout.
// Despliegue:  supabase functions deploy create-checkout --no-verify-jwt
// Secrets:     STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// =====================================================================
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  try {
    const { palmera, price_eur, currency } = await req.json();
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identificar al usuario por su token
    const { data: userData } = await supabase.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    // Crear la palmera (pendiente de pago)
    const { data: row, error } = await supabase
      .from("palmeras")
      .insert({
        owner_id: user.id,
        owner_name: palmera.owner_name ?? user.email,
        name: palmera.name,
        family_note: palmera.family_note ?? null,
        description: palmera.description ?? null,
        dedication: palmera.dedication ?? null,
        media: palmera.media ?? [],
        firework_type: palmera.firework_type,
        lat: palmera.lat,
        lng: palmera.lng,
        ignite_at: palmera.ignite_at,
        color: palmera.color ?? null,
        is_paid: false,
      })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);

    const origin = req.headers.get("origin") || "https://palmar.app";
    const amount = Math.round((price_eur ?? 2.99) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: row.id,
      metadata: { palmera_id: row.id, user_id: user.id },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: (currency || "eur").toLowerCase(),
          unit_amount: amount,
          product_data: {
            name: "PalmAR · Apadrinament de palmera",
            description: palmera.name,
          },
        },
      }],
      success_url: `${origin}/?paid=1&palmera=${row.id}`,
      cancel_url: `${origin}/?canceled=1`,
    });

    await supabase.from("orders").insert({
      user_id: user.id,
      palmera_id: row.id,
      stripe_session_id: session.id,
      status: "pending",
      amount,
    });

    return json({ url: session.url, sessionId: session.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

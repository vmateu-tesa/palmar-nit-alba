// =====================================================================
// PalmAR — Edge Function: stripe-webhook
// Marca la palmera como pagada cuando Stripe confirma el pago.
// Despliegue:  supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets:     STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//              SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// En Stripe:   añade el endpoint y el evento checkout.session.completed
// =====================================================================
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, whSecret);
  } catch (e) {
    return new Response("bad signature: " + String(e), { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const palmeraId = (s.metadata?.palmera_id) || s.client_reference_id;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    if (palmeraId) {
      await supabase.from("palmeras").update({ is_paid: true }).eq("id", palmeraId);
      await supabase.from("orders").update({ status: "paid" }).eq("stripe_session_id", s.id);
    }
  }

  return new Response("ok", { status: 200 });
});

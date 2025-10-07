// @ts-nocheck
// Deno Deploy Edge Function: Crear Checkout de Stripe
// Env vars: STRIPE_SECRET_KEY, PROJECT_URL, SERVICE_ROLE_KEY
import Stripe from "https://esm.sh/stripe@16.8.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20"
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateCheckoutPayload = {
  itemType: "tipo_reserva" | "tipo_bono";
  itemId?: number;
  itemName?: string;
  fecha?: string;
  franjaId?: number;
  tipoReservaId?: number;
  couponCode?: string | null;
  successUrl: string;
  cancelUrl: string;
};

function assertEnv() {
  const missing: string[] = [];
  if (!Deno.env.get("STRIPE_SECRET_KEY")) missing.push("STRIPE_SECRET_KEY");
  if (!Deno.env.get("PROJECT_URL")) missing.push("PROJECT_URL");
  if (!Deno.env.get("SERVICE_ROLE_KEY")) missing.push("SERVICE_ROLE_KEY");
  if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
}

function cents(n: number) {
  return Math.round(n * 100);
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    assertEnv();
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const body = (await req.json()) as CreateCheckoutPayload;

    const sb = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: authData, error: authErr } = await sb.auth.getUser();
    if (authErr || !authData?.user?.id) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    const userId = authData.user.id;

    let precio = 0;
    let name = "";
    let itemId: number | null = body.itemId ?? null;

    if (body.itemType === "tipo_reserva") {
      const q = sb.from("tipos_reserva").select("id, nombre, precio_entrada").limit(1);
      const { data, error } = body.itemId
        ? await q.eq("id", body.itemId).maybeSingle()
        : await q.eq("nombre", body.itemName ?? "").maybeSingle();
      if (error) throw error;
      if (!data) return new Response(JSON.stringify({ error: "tipo_reserva no encontrado" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
      name = data.nombre;
      itemId = data.id;
      precio = Number(data.precio_entrada);
    } else {
      const q = sb.from("tipos_bono").select("id, nombre, precio").limit(1);
      const { data, error } = body.itemId
        ? await q.eq("id", body.itemId).maybeSingle()
        : await q.eq("nombre", body.itemName ?? "").maybeSingle();
      if (error) throw error;
      if (!data) return new Response(JSON.stringify({ error: "tipo_bono no encontrado" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
      name = data.nombre;
      itemId = data.id;
      precio = Number(data.precio);
    }

    let precioFinal = precio;
    let cuponId: number | null = null;
    if (body.couponCode && body.couponCode.trim()) {
      const { data: u } = await sb.auth.getUser();
      const { data: profile, error: eProf } = await sb.from("perfiles").select("id").eq("id", u?.user?.id).maybeSingle();
      if (eProf) throw eProf;
      if (!profile) return new Response(JSON.stringify({ error: "perfil no encontrado" }), { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } });
      const { data: res, error: eVal } = await sb.rpc("validar_cupon", {
        _codigo: body.couponCode,
        _usuario_id: profile.id,
        _tipo_item: body.itemType,
        _item_id: itemId,
        _precio: precio
      });
      if (eVal) throw eVal;
      if (Array.isArray(res) && res.length) {
        const row = res[0] as any;
        if (row.valido) {
          precioFinal = Number(row.precio_final);
          cuponId = row.cupon_id ?? null;
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: cents(precioFinal),
            product_data: { name }
          },
          quantity: 1
        }
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        item_type: body.itemType,
        item_id: String(itemId),
        cupon_id: cuponId ? String(cuponId) : "",
        fecha: body.fecha ?? "",
        franja_id: body.franjaId ? String(body.franjaId) : "",
        tipo_reserva_id: body.tipoReservaId ? String(body.tipoReservaId) : ""
      }
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
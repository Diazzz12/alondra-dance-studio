// @ts-nocheck
// Deno Deploy Edge Function: Webhook de Stripe
// Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import Stripe from "https://esm.sh/stripe@16.8.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, stripe-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function assertEnv() {
  const missing: string[] = [];
  if (!Deno.env.get("STRIPE_SECRET_KEY")) missing.push("STRIPE_SECRET_KEY");
  if (!Deno.env.get("STRIPE_WEBHOOK_SECRET")) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!Deno.env.get("PROJECT_URL")) missing.push("PROJECT_URL");
  if (!Deno.env.get("SERVICE_ROLE_KEY")) missing.push("SERVICE_ROLE_KEY");
  if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    assertEnv();
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new Response("Bad Request", { status: 400, headers: corsHeaders });
    const bodyText = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(bodyText, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
    } catch (err) {
      return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
    }

    const sb = createClient(Deno.env.get("PROJECT_URL")!, Deno.env.get("SERVICE_ROLE_KEY")!);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};
      const usuarioId = session.client_reference_id ?? null;

      // Si es reserva con franja, crear reserva confirmada (impacta disponibilidad)
      if (meta.item_type === 'tipo_reserva' && usuarioId && meta.fecha && meta.franja_horaria_id && meta.tipo_reserva_id) {
        try {
          const tipoReservaId = Number(meta.tipo_reserva_id);
          const franjaHorariaId = Number(meta.franja_horaria_id);
          const fecha = String(meta.fecha);
          const { data: tr } = await sb.from('tipos_reserva').select('numero_barras').eq('id', tipoReservaId).single();
          const numeroBarras = tr?.numero_barras ?? 1;
          await sb.from('reservas').insert({
            usuario_id: usuarioId as any,
            fecha,
            franja_horaria_id: franjaHorariaId,
            tipo_reserva_id: tipoReservaId,
            numero_barras: numeroBarras,
            metodo_pago: 'entrada',
            precio_pagado: Number(session.amount_total ?? 0) / 100,
            estado: 'confirmada',
          });
        } catch (e) {
          console.error('Error creando reserva confirmada:', e);
        }
      }

      // Registrar pago
      const cantidad = Number(session.amount_total ?? 0) / 100;
      const { error: payErr } = await sb.from("pagos").insert({
        usuario_id: usuarioId as any,
        tipo: meta.item_type === 'tipo_bono' ? 'bono' : 'entrada',
        referencia_id: Number(meta.item_id ?? 0),
        metodo_pago: 'stripe',
        cantidad,
        estado: 'completado',
        transaccion_id: session.id,
      });
      if (payErr) console.error(payErr);

      // Redención de cupón si existe
      if (meta.cupon_id && usuarioId) {
        const { error: redErr } = await sb.from("cupones_redenciones").insert({
          cupon_id: Number(meta.cupon_id),
          usuario_id: usuarioId as any,
          referencia_tipo: meta.item_type === 'tipo_bono' ? 'bono' : 'reserva',
          referencia_id: Number(meta.item_id ?? 0),
        });
        if (redErr) console.error(redErr);
      }

      // Si es bono, crear bonos_usuario (instanciar bono) automáticamente
      if (meta.item_type === 'tipo_bono' && usuarioId) {
        const tipoBonoId = Number(meta.item_id);
        // Nota: asignar usuario_id adecuadamente; aquí se deja como null hasta enlazar
        const { data: tb, error: eTb } = await sb.from('tipos_bono').select('numero_clases, duracion_dias').eq('id', tipoBonoId).single();
        if (!eTb && tb) {
          const fechaCad = new Date();
          fechaCad.setDate(fechaCad.getDate() + Number(tb.duracion_dias));
          await sb.from('bonos_usuario').insert({
            usuario_id: usuarioId as any,
            tipo_bono_id: tipoBonoId,
            fecha_caducidad: fechaCad.toISOString().slice(0,10),
            clases_restantes: Number(tb.numero_clases),
            clases_totales: Number(tb.numero_clases),
            estado: 'activo',
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});



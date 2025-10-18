// @ts-nocheck
// Webhook de Stripe con envío de emails via API SMTP2GO o SMTP directo
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
let stripeClient = null;
async function getStripeClient() {
  if (stripeClient) return stripeClient;
  const mod = await import("https://esm.sh/stripe@12.17.0?target=deno&deno-std=0.177.1");
  const Stripe = mod.default;
  stripeClient = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: "2025-09-30"
  });
  return stripeClient;
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function assertEnv() {
  const missing = [];
  if (!Deno.env.get("STRIPE_SECRET_KEY")) missing.push("STRIPE_SECRET_KEY");
  if (!Deno.env.get("STRIPE_WEBHOOK_SECRET")) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!Deno.env.get("SUPABASE_URL")) missing.push("SUPABASE_URL");
  if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!Deno.env.get("MAIL_FROM")) missing.push("MAIL_FROM");
  // Priorizar SMTP2GO sobre Brevo (más flexible con dominios)
  const hasSmtp2go = Deno.env.get("SMTP2GO_API_KEY");
  const hasBrevo = Deno.env.get("BREVO_API_KEY");
  if (!hasSmtp2go && !hasBrevo) {
    missing.push("SMTP2GO_API_KEY o BREVO_API_KEY");
  }
  if (missing.length) {
    console.error(`Faltan variables de entorno: ${missing.join(", ")}`);
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }
  console.log("✓ Variables de entorno configuradas");
}
// Envío de emails via API (SMTP2GO prioritario, luego Brevo)
async function sendEmail(to, subject, html, text) {
  try {
    const fromName = Deno.env.get("MAIL_FROM_NAME") || "Alondra Pole Space";
    const fromEmail = Deno.env.get("MAIL_FROM");
    console.log(`📧 Intentando enviar email:`);
    console.log(`   To: ${to}`);
    console.log(`   From: ${fromName} <${fromEmail}>`);
    console.log(`   Subject: ${subject}`);
    // Opción A: SMTP2GO (más permisivo con dominios) - PRIORITARIO
    const smtp2goKey = Deno.env.get("SMTP2GO_API_KEY");
    if (smtp2goKey) {
      console.log(`   Servicio: SMTP2GO`);
      const response = await fetch("https://api.smtp2go.com/v3/email/send", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          api_key: smtp2goKey,
          to: [
            to
          ],
          sender: fromEmail,
          subject: subject,
          html_body: html,
          text_body: text || html.replace(/<[^>]*>/g, ''),
          custom_headers: [
            {
              header: "Reply-To",
              value: fromEmail
            }
          ]
        })
      });
      const responseData = await response.json();
      console.log(`   Respuesta SMTP2GO (${response.status}):`, JSON.stringify(responseData));
      if (!response.ok || responseData.data?.error) {
        console.error(`✗ Error SMTP2GO:`, responseData);
        throw new Error(`SMTP2GO error: ${responseData.data?.error || response.status}`);
      }
      console.log(`✓ Email enviado vía SMTP2GO a ${to}`);
      return;
    }
    // Opción B: Brevo (Sendinblue) - requiere verificación
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (brevoKey) {
      console.log(`   Servicio: Brevo`);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: {
            name: fromName,
            email: fromEmail
          },
          to: [
            {
              email: to
            }
          ],
          subject: subject,
          htmlContent: html,
          textContent: text || html.replace(/<[^>]*>/g, '')
        })
      });
      const responseData = await response.json();
      console.log(`   Respuesta Brevo (${response.status}):`, JSON.stringify(responseData));
      if (!response.ok) {
        console.error(`✗ Error Brevo:`, responseData);
        throw new Error(`Brevo error: ${response.status}`);
      }
      console.log(`✓ Email enviado vía Brevo a ${to} - MessageID: ${responseData.messageId || 'N/A'}`);
      return;
    }
    throw new Error("No hay servicio de email configurado");
  } catch (error) {
    console.error(`✗ Error enviando email a ${to}:`, error.message);
  // No lanzamos error para que no falle el webhook por un email
  }
}
// Función principal del webhook
Deno.serve(async (req)=>{
  console.log("=== WEBHOOK STRIPE RECIBIDO ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    assertEnv();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      console.log("✗ Missing stripe-signature header");
      return new Response("Missing stripe-signature", {
        status: 400,
        headers: corsHeaders
      });
    }
    const bodyText = await req.text();
    console.log("Body length:", bodyText.length);
    const stripe = await getStripeClient();
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(bodyText, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET"));
      console.log("✓ Event verified successfully:", event.type);
    } catch (err) {
      console.error("✗ Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, {
        status: 400,
        headers: corsHeaders
      });
    }
    // Cliente Supabase con SERVICE_ROLE_KEY (bypass RLS)
    const sb = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata ?? {};
      const usuarioId = session.client_reference_id ?? null;
      console.log('=== Datos del checkout ===');
      console.log('Session ID:', session.id);
      console.log('Metadata:', JSON.stringify(meta, null, 2));
      console.log('Usuario ID:', usuarioId);
      const franjaIdStr = meta.franja_id || "";
      const tipoReservaIdStr = meta.tipo_reserva_id || "";
      console.log('franja_id:', franjaIdStr, 'tipo_reserva_id:', tipoReservaIdStr, 'fecha:', meta.fecha);
      // Obtener email del usuario desde auth.users
      let userEmail = null;
      if (usuarioId) {
        const { data: userData, error: userError } = await sb.auth.admin.getUserById(usuarioId);
        if (userError) {
          console.error('✗ Error obteniendo email del usuario:', userError);
        } else {
          userEmail = userData?.user?.email || null;
          console.log('✓ Email del usuario obtenido:', userEmail);
        }
      }
      if (meta.item_type === 'tipo_reserva' && usuarioId && meta.fecha && franjaIdStr && tipoReservaIdStr) {
        try {
          const tipoReservaId = Number(tipoReservaIdStr);
          const franjaHorariaId = Number(franjaIdStr);
          const fecha = String(meta.fecha);
          console.log('→ Creando reserva:', {
            usuarioId,
            fecha,
            franjaHorariaId,
            tipoReservaId
          });
          // Obtener número de barras del tipo de reserva
          const { data: tr, error: trError } = await sb.from('tipos_reserva').select('numero_barras, nombre').eq('id', tipoReservaId).single();
          if (trError) {
            console.error('✗ Error obteniendo tipo_reserva:', trError);
            return new Response(JSON.stringify({
              error: "Error obteniendo tipo_reserva",
              details: trError
            }), {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            });
          }
          const numeroBarras = tr?.numero_barras ?? 1;
          const nombreTipoReserva = tr?.nombre ?? 'Reserva';
          console.log('✓ numero_barras:', numeroBarras);
          // Obtener datos de la franja horaria
          const { data: franja, error: franjaError } = await sb.from('franjas_horarias').select('hora_inicio, hora_fin').eq('id', franjaHorariaId).single();
          // Crear reserva
          const { data: reservaData, error: reservaError } = await sb.from('reservas').insert({
            usuario_id: usuarioId,
            fecha,
            franja_horaria_id: franjaHorariaId,
            tipo_reserva_id: tipoReservaId,
            numero_barras: numeroBarras,
            metodo_pago: 'entrada',
            precio_pagado: Number(session.amount_total ?? 0) / 100,
            estado: 'confirmada'
          }).select();
          if (reservaError) {
            console.error('✗ Error insertando reserva:', reservaError);
            return new Response(JSON.stringify({
              error: "Error insertando reserva",
              details: reservaError
            }), {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            });
          } else {
            console.log('✓ Reserva creada exitosamente:', reservaData);
            // Enviar email de confirmación de reserva
            if (userEmail) {
              const horaInicio = franja?.hora_inicio || '';
              const horaFin = franja?.hora_fin || '';
              const horario = horaInicio && horaFin ? `de ${horaInicio} a ${horaFin}` : '';
              const subject = "✅ Reserva confirmada - Alondra Pole Space";
              const html = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    strong { color: #667eea; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎉 ¡Reserva Confirmada!</h1>
                    </div>
                    <div class="content">
                      <p>¡Hola!</p>
                      <p>Tu reserva en <strong>Alondra Pole Space</strong> ha sido confirmada con éxito.</p>
                      
                      <div class="info-box">
                        <h2 style="margin-top: 0; color: #667eea;">📋 Detalles de tu reserva</h2>
                        <p><strong>📅 Fecha:</strong> ${fecha}</p>
                        <p><strong>🕐 Horario:</strong> ${horario}</p>
                        <p><strong>💎 Tipo:</strong> ${nombreTipoReserva}</p>
                        <p><strong>💰 Precio:</strong> ${(Number(session.amount_total ?? 0) / 100).toFixed(2)}€</p>
                      </div>
                      
                      <p>Puedes consultar todos los detalles de tu reserva en tu perfil de usuario.</p>
                      <p>¡Te esperamos! 💪✨</p>
                      
                      <div class="footer">
                        <p>Alondra Pole Space</p>
                        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `;
              const text = `¡Reserva confirmada!\n\nFecha: ${fecha}\nHorario: ${horario}\nTipo: ${nombreTipoReserva}\nPrecio: ${(Number(session.amount_total ?? 0) / 100).toFixed(2)}€\n\nPuedes consultar tu reserva en tu perfil.\n¡Te esperamos!`;
              await sendEmail(userEmail, subject, html, text);
            }
          }
        } catch (e) {
          console.error('✗ Error creando reserva confirmada:', e);
          return new Response(JSON.stringify({
            error: "Error creando reserva",
            details: e.message
          }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
      } else {
        console.log('⚠ No se cumple condición para crear reserva:', {
          item_type: meta.item_type,
          usuarioId: !!usuarioId,
          fecha: meta.fecha,
          franjaId: franjaIdStr,
          tipoReservaId: tipoReservaIdStr
        });
      }
      // Calcular cantidad al inicio para usarla en todo el bloque
      const cantidadPagada = Number(session.amount_total ?? 0) / 100;
      // Registrar pago
      console.log('→ Registrando pago...');
      const { error: payErr } = await sb.from("pagos").insert({
        usuario_id: usuarioId,
        tipo: meta.item_type === 'tipo_bono' ? 'bono' : 'entrada',
        referencia_id: Number(meta.item_id ?? 0),
        metodo_pago: 'stripe',
        cantidad: cantidadPagada,
        estado: 'completado',
        transaccion_id: session.id
      });
      if (payErr) {
        console.error('✗ Error insertando pago:', payErr);
      } else {
        console.log('✓ Pago registrado exitosamente');
      }
      // Si es bono, crear bonos_usuario (instanciar bono)
      if (meta.item_type === 'tipo_bono' && usuarioId && meta.item_id) {
        try {
          console.log('→ Creando bono de usuario...');
          const tipoBonoId = Number(meta.item_id);
          const { data: tb, error: eTb } = await sb.from('tipos_bono').select('numero_clases, duracion_dias, nombre').eq('id', tipoBonoId).single();
          if (eTb) throw eTb;
          if (!tb) throw new Error('tipo_bono no encontrado');
          const fechaCad = new Date();
          fechaCad.setDate(fechaCad.getDate() + Number(tb.duracion_dias));
          const { error: bonoErr } = await sb.from('bonos_usuario').insert({
            usuario_id: usuarioId,
            tipo_bono_id: tipoBonoId,
            fecha_caducidad: fechaCad.toISOString().slice(0, 10),
            clases_restantes: Number(tb.numero_clases),
            clases_totales: Number(tb.numero_clases),
            estado: 'activo'
          });
          if (bonoErr) {
            console.error('✗ Error creando bono_usuario:', bonoErr);
          } else {
            console.log('✓ Bono de usuario creado');
            // Enviar email de confirmación de compra de bono
            if (userEmail) {
              const subject = '✅ Bono adquirido - Alondra Pole Space';
              const html = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    strong { color: #667eea; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎫 ¡Bono Adquirido!</h1>
                    </div>
                    <div class="content">
                      <p>¡Hola!</p>
                      <p>Has adquirido el bono <strong>${tb.nombre}</strong> en Alondra Pole Space.</p>
                      
                      <div class="info-box">
                        <h2 style="margin-top: 0; color: #667eea;">📋 Detalles de tu bono</h2>
                        <p><strong>🎫 Bono:</strong> ${tb.nombre}</p>
                        <p><strong>📊 Clases incluidas:</strong> ${tb.numero_clases}</p>
                        <p><strong>📅 Válido hasta:</strong> ${fechaCad.toISOString().slice(0, 10)}</p>
                        <p><strong>💰 Precio:</strong> ${cantidadPagada.toFixed(2)}€</p>
                      </div>
                      
                      <p>Puedes usar tu bono para reservar clases en cualquier momento. Consulta tus bonos activos en tu perfil de usuario.</p>
                      <p>¡Disfruta de tus clases! 💪✨</p>
                      
                      <div class="footer">
                        <p>Alondra Pole Space</p>
                        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `;
              const text = `¡Bono adquirido!\n\nBono: ${tb.nombre}\nClases: ${tb.numero_clases}\nVálido hasta: ${fechaCad.toISOString().slice(0, 10)}\nPrecio: ${cantidadPagada.toFixed(2)}€\n\nPuedes usar tu bono en cualquier momento.\n¡Disfruta de tus clases!`;
              await sendEmail(userEmail, subject, html, text);
            }
          }
        } catch (e) {
          console.error('✗ Error al crear bono de usuario:', e);
        }
      }
    }
    console.log("=== Webhook procesado exitosamente ===");
    return new Response(JSON.stringify({
      received: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (e) {
    console.error('✗ Webhook error general:', e);
    return new Response(JSON.stringify({
      error: String(e?.message ?? e)
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});

// @ts-nocheck
// Edge Function para enviar email de confirmación de reserva
// Puede ser llamada desde webhooks, triggers o directamente desde el cliente
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Envío de emails via API (SMTP2GO prioritario, luego Brevo)
async function sendEmail(to, subject, html, text) {
  try {
    const fromName = Deno.env.get("MAIL_FROM_NAME") || "Alondra Pole Space";
    const fromEmail = Deno.env.get("MAIL_FROM");
    console.log(`📧 Intentando enviar email:`);
    console.log(`   To: ${to}`);
    console.log(`   From: ${fromName} <${fromEmail}>`);
    console.log(`   Subject: ${subject}`);
    
    // Opción A: SMTP2GO
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
          to: [to],
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
    
    // Opción B: Brevo
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
    throw error;
  }
}

Deno.serve(async (req) => {
  console.log("=== ENVÍO EMAIL RESERVA ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL"), 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );
    
    const body = await req.json();
    const { reserva_id } = body;
    
    if (!reserva_id) {
      return new Response(JSON.stringify({
        error: "Falta reserva_id"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    console.log(`→ Procesando reserva ID: ${reserva_id}`);
    
    // Obtener datos de la reserva con joins
    const { data: reserva, error: reservaError } = await sb
      .from('reservas')
      .select(`
        *,
        franjas_horarias (hora_inicio, hora_fin),
        tipos_reserva (nombre, numero_barras)
      `)
      .eq('id', reserva_id)
      .single();
      
    if (reservaError || !reserva) {
      console.error('✗ Error obteniendo reserva:', reservaError);
      throw new Error('Reserva no encontrada');
    }
    
    console.log('✓ Reserva obtenida:', JSON.stringify(reserva));
    
    // Obtener email del usuario desde auth.users
    const { data: userData, error: userError } = await sb.auth.admin.getUserById(reserva.usuario_id);
    if (userError || !userData?.user?.email) {
      console.error('✗ Error obteniendo email del usuario:', userError);
      throw new Error('Email del usuario no encontrado');
    }
    
    const userEmail = userData.user.email;
    console.log('✓ Email del usuario:', userEmail);
    
    // Preparar datos del email
    const fecha = reserva.fecha;
    const horaInicio = reserva.franjas_horarias?.hora_inicio || '';
    const horaFin = reserva.franjas_horarias?.hora_fin || '';
    const horario = horaInicio && horaFin ? `de ${horaInicio} a ${horaFin}` : '';
    const nombreTipoReserva = reserva.tipos_reserva?.nombre || 'Reserva';
    const metodoPago = reserva.metodo_pago === 'bono' ? 'Bono' : 'Pago directo';
    const precio = reserva.metodo_pago === 'bono' ? 'Gratis (bono)' : `${Number(reserva.precio_pagado || 0).toFixed(2)}€`;
    
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
              <p><strong>💳 Método de pago:</strong> ${metodoPago}</p>
              <p><strong>💰 Precio:</strong> ${precio}</p>
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
    const text = `¡Reserva confirmada!\n\nFecha: ${fecha}\nHorario: ${horario}\nTipo: ${nombreTipoReserva}\nMétodo de pago: ${metodoPago}\nPrecio: ${precio}\n\nPuedes consultar tu reserva en tu perfil.\n¡Te esperamos!`;
    
    // Enviar email
    await sendEmail(userEmail, subject, html, text);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Email enviado"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('✗ Error general:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});

// @ts-nocheck
// Edge Function para enviar email de confirmación de reserva
// Puede ser llamada desde webhooks, triggers o directamente desde el cliente
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/crypto.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const TTLOCK_API_BASE = "https://euapi.ttlock.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// ========== FUNCIONES TTLOCK ==========
async function getMD5(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return encodeHex(new Uint8Array(hashBuffer));
}
async function getTTLockAccessToken(clientId, clientSecret, username, password) {
  const date = Date.now();
  const passwordMD5 = await getMD5(password);
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("username", username);
  params.append("password", passwordMD5);
  params.append("grant_type", "password");
  params.append("date", date.toString());
  console.log("🔑 Obteniendo TTLock access token...");
  const response = await fetch(`${TTLOCK_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  const data = await response.json();
  // Si hay errcode y no es 0, es un error
  if (data.errcode !== undefined && data.errcode !== 0) {
    console.error("❌ Error TTLock auth:", data);
    throw new Error(`TTLock auth error: ${data.errmsg || data.errcode}`);
  }
  // Si no hay access_token, también es un error
  if (!data.access_token) {
    console.error("❌ Error TTLock auth - no access_token:", data);
    throw new Error("TTLock auth error: no access_token received");
  }
  console.log("✅ TTLock access token obtenido");
  return data.access_token;
}
async function createTTLockPasscode(clientId, accessToken, lockId, passcode, startDate, endDate) {
  const date = Date.now();
  const url = new URL(`${TTLOCK_API_BASE}/v3/keyboardPwd/add`);
  url.searchParams.append("clientId", clientId);
  url.searchParams.append("accessToken", accessToken);
  url.searchParams.append("lockId", lockId.toString());
  url.searchParams.append("keyboardPwd", passcode);
  url.searchParams.append("keyboardPwdName", `Reserva-${date}`);
  url.searchParams.append("startDate", startDate.toString());
  url.searchParams.append("endDate", endDate.toString());
  url.searchParams.append("addType", "2");
  url.searchParams.append("date", date.toString());
  console.log("🔐 Creando passcode TTLock...", {
    lockId,
    passcode,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString()
  });
  const response = await fetch(url.toString(), {
    method: "POST"
  });
  const data = await response.json();
  // Si hay errcode y no es 0, es un error
  if (data.errcode !== undefined && data.errcode !== 0) {
    console.error("❌ Error creando passcode:", data);
    throw new Error(`TTLock passcode error: ${data.errmsg || data.errcode}`);
  }
  // Verificar que se haya creado el passcode
  if (!data.keyboardPwdId) {
    console.error("❌ Error creando passcode - no keyboardPwdId:", data);
    throw new Error("TTLock passcode error: no keyboardPwdId received");
  }
  console.log("✅ Passcode creado:", data.keyboardPwdId);
  return {
    passcodeId: data.keyboardPwdId,
    passcode: passcode
  };
}
async function generarCodigoAccesoReserva(fecha, horaInicio, horaFin, minutosAntes = 15, minutosDespues = 15) {
  const CLIENT_ID = Deno.env.get("TTLOCK_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("TTLOCK_CLIENT_SECRET");
  const USERNAME = Deno.env.get("TTLOCK_USERNAME");
  const PASSWORD = Deno.env.get("TTLOCK_PASSWORD");
  const LOCK_ID = Number(Deno.env.get("TTLOCK_LOCK_ID"));
  if (!CLIENT_ID || !CLIENT_SECRET || !USERNAME || !PASSWORD || !LOCK_ID) {
    throw new Error("Faltan credenciales de TTLock");
  }
  const accessToken = await getTTLockAccessToken(CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD);
  // 🧪 MODO PRUEBAS: Código válido AHORA por 3 minutos
  const ahora = new Date();
  const fechaInicio = new Date(ahora);
  const fechaFin = new Date(ahora.getTime() + 3 * 60 * 1000);
  // 📅 MODO PRODUCCIÓN: Descomentar estas líneas y comentar las de arriba
  // const [year, month, day] = fecha.split("-").map(Number);
  // const [horaInicioH, horaInicioM] = horaInicio.split(":").map(Number);
  // const [horaFinH, horaFinM] = horaFin.split(":").map(Number);
  // const fechaInicio = new Date(year, month - 1, day, horaInicioH, horaInicioM);
  // const fechaFin = new Date(year, month - 1, day, horaFinH, horaFinM);
  // fechaInicio.setMinutes(fechaInicio.getMinutes() - minutosAntes);
  // fechaFin.setMinutes(fechaFin.getMinutes() + minutosDespues);
  const startDate = fechaInicio.getTime();
  const endDate = fechaFin.getTime();
  const passcode = Math.floor(100000 + Math.random() * 900000).toString();
  const resultado = await createTTLockPasscode(CLIENT_ID, accessToken, LOCK_ID, passcode, startDate, endDate);
  return {
    codigo: resultado.passcode,
    passcodeId: resultado.passcodeId,
    validoDesde: fechaInicio.toISOString(),
    validoHasta: fechaFin.toISOString()
  };
}
// ========== FIN FUNCIONES TTLOCK ==========

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
    
    // Generar código de acceso TTLock
    let codigoAcceso = null;
    let validoDesde = null;
    let validoHasta = null;
    try {
      console.log('🔐 Generando código de acceso TTLock...');
      console.log('   Variables TTLock:', {
        hasClientId: !!Deno.env.get("TTLOCK_CLIENT_ID"),
        hasClientSecret: !!Deno.env.get("TTLOCK_CLIENT_SECRET"),
        hasUsername: !!Deno.env.get("TTLOCK_USERNAME"),
        hasPassword: !!Deno.env.get("TTLOCK_PASSWORD"),
        hasLockId: !!Deno.env.get("TTLOCK_LOCK_ID")
      });
      
      if (horaInicio && horaFin) {
        console.log('→ Generando código de acceso TTLock...');
        const resultadoCodigo = await generarCodigoAccesoReserva(fecha, horaInicio, horaFin);
        codigoAcceso = resultadoCodigo.codigo;
        validoDesde = resultadoCodigo.validoDesde;
        validoHasta = resultadoCodigo.validoHasta;
        console.log('✓ Código generado:', codigoAcceso);
        
        // Guardar código en la reserva
        const { error: updateError } = await sb.from('reservas').update({
          codigo_acceso: codigoAcceso,
          codigo_acceso_id: resultadoCodigo.passcodeId
        }).eq('id', reserva_id);
        
        if (updateError) {
          console.error('✗ Error guardando código:', updateError);
        } else {
          console.log('✓ Código de acceso guardado en reserva');
        }
      } else {
        console.log('⚠ No se puede generar código: faltan horas de inicio/fin');
      }
    } catch (ttlockError) {
      console.error('✗ Error generando código TTLock:', ttlockError);
      console.error('   Stack:', ttlockError.stack);
    }
    
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
            
            ${codigoAcceso ? `
            <div class="info-box" style="background: #fff3cd; border-left: 4px solid #ffc107;">
              <h2 style="margin-top: 0; color: #856404;">🔑 Código de acceso</h2>
              <p style="font-size: 32px; font-weight: bold; text-align: center; color: #856404; letter-spacing: 4px; margin: 20px 0;">
                ${codigoAcceso}
              </p>
              <p style="font-size: 12px; color: #856404;">
                <strong>Válido desde:</strong> ${validoDesde ? new Date(validoDesde).toLocaleString('es-ES') : ''}<br>
                <strong>Válido hasta:</strong> ${validoHasta ? new Date(validoHasta).toLocaleString('es-ES') : ''}
              </p>
              <p style="font-size: 12px; color: #856404;">
                Introduce este código en el teclado de la puerta para acceder al local.
              </p>
            </div>
            ` : ''}
            
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
    const codigoTexto = codigoAcceso ? `\n\n🔑 CÓDIGO DE ACCESO: ${codigoAcceso}\nVálido desde: ${validoDesde ? new Date(validoDesde).toLocaleString('es-ES') : ''}\nVálido hasta: ${validoHasta ? new Date(validoHasta).toLocaleString('es-ES') : ''}\n\nIntroduce este código en el teclado de la puerta.\n` : '';
    const text = `¡Reserva confirmada!\n\nFecha: ${fecha}\nHorario: ${horario}\nTipo: ${nombreTipoReserva}\nMétodo de pago: ${metodoPago}\nPrecio: ${precio}${codigoTexto}\n\nPuedes consultar tu reserva en tu perfil.\n¡Te esperamos!`;
    
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

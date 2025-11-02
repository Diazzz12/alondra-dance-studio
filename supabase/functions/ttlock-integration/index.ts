// @ts-nocheck
// Edge Function para integrar con TTLock API
// Genera códigos de acceso para las reservas
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Configuración de TTLock API
const TTLOCK_CONFIG = {
  clientId: Deno.env.get("TTLOCK_CLIENT_ID"),
  clientSecret: Deno.env.get("TTLOCK_CLIENT_SECRET"),
  baseUrl: "https://api.ttlock.com",
  lockId: Deno.env.get("TTLOCK_LOCK_ID"), // ID de tu cerradura específica
};

// Obtener access token de TTLock
async function getTTLockAccessToken() {
  try {
    console.log("🔑 Obteniendo access token de TTLock...");
    
    const response = await fetch(`${TTLOCK_CONFIG.baseUrl}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: TTLOCK_CONFIG.clientId,
        client_secret: TTLOCK_CONFIG.clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error obteniendo access token:", data);
      throw new Error(`TTLock auth error: ${data.error_description || data.error}`);
    }

    console.log("✅ Access token obtenido");
    return data.access_token;
  } catch (error) {
    console.error("❌ Error en getTTLockAccessToken:", error);
    throw error;
  }
}

// Generar código de acceso temporal
async function generatePasscode(accessToken: string, startTime: number, endTime: number, passcodeName?: string) {
  try {
    console.log("🔐 Generando código de acceso...");
    console.log(`   Inicio: ${new Date(startTime).toISOString()}`);
    console.log(`   Fin: ${new Date(endTime).toISOString()}`);
    
    const response = await fetch(`${TTLOCK_CONFIG.baseUrl}/v3/keyboardPwd/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: new URLSearchParams({
        lockId: TTLOCK_CONFIG.lockId,
        keyboardPwdType: "2", // Código temporal
        keyboardPwdName: passcodeName || `Reserva ${new Date().toISOString().slice(0, 10)}`,
        startDate: Math.floor(startTime / 1000).toString(), // TTLock usa segundos
        endDate: Math.floor(endTime / 1000).toString(),
        addType: "1", // Añadir vía servidor
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error generando código:", data);
      throw new Error(`TTLock passcode error: ${data.errmsg || data.error}`);
    }

    console.log("✅ Código de acceso generado:", data.keyboardPwdId);
    return {
      passcodeId: data.keyboardPwdId,
      passcode: data.keyboardPwd, // El código numérico
    };
  } catch (error) {
    console.error("❌ Error en generatePasscode:", error);
    throw error;
  }
}

// Eliminar código de acceso (para limpieza)
async function deletePasscode(accessToken: string, passcodeId: string) {
  try {
    console.log("🗑️ Eliminando código de acceso:", passcodeId);
    
    const response = await fetch(`${TTLOCK_CONFIG.baseUrl}/v3/keyboardPwd/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: new URLSearchParams({
        lockId: TTLOCK_CONFIG.lockId,
        keyboardPwdId: passcodeId,
        deleteType: "1", // Eliminar vía servidor
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error eliminando código:", data);
      throw new Error(`TTLock delete error: ${data.errmsg || data.error}`);
    }

    console.log("✅ Código eliminado");
    return true;
  } catch (error) {
    console.error("❌ Error en deletePasscode:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  console.log("=== TTLOCK INTEGRATION ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    const { action, reserva_id, start_time, end_time, passcode_name } = body;
    
    // Verificar configuración
    if (!TTLOCK_CONFIG.clientId || !TTLOCK_CONFIG.clientSecret || !TTLOCK_CONFIG.lockId) {
      throw new Error("Configuración de TTLock incompleta. Verifica las variables de entorno.");
    }
    
    if (action === "generate_passcode") {
      if (!reserva_id || !start_time || !end_time) {
        throw new Error("Faltan parámetros: reserva_id, start_time, end_time");
      }
      
      // Obtener access token
      const accessToken = await getTTLockAccessToken();
      
      // Generar código de acceso
      const passcodeData = await generatePasscode(
        accessToken,
        start_time,
        end_time,
        passcode_name || `Reserva ${reserva_id}`
      );
      
      // Guardar en base de datos (opcional)
      const sb = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );
      
      // Actualizar reserva con el código de acceso
      const { error: updateError } = await sb
        .from('reservas')
        .update({
          codigo_acceso: passcodeData.passcode,
          codigo_acceso_id: passcodeData.passcodeId,
        })
        .eq('id', reserva_id);
        
      if (updateError) {
        console.error("⚠️ Error guardando código en BD:", updateError);
        // No fallar si no se puede guardar en BD
      }
      
      return new Response(JSON.stringify({
        success: true,
        passcode: passcodeData.passcode,
        passcodeId: passcodeData.passcodeId,
        message: "Código de acceso generado"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    if (action === "delete_passcode") {
      const { passcode_id } = body;
      if (!passcode_id) {
        throw new Error("Falta passcode_id");
      }
      
      const accessToken = await getTTLockAccessToken();
      await deletePasscode(accessToken, passcode_id);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Código de acceso eliminado"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    throw new Error("Acción no válida. Usa 'generate_passcode' o 'delete_passcode'");
    
  } catch (error) {
    console.error("❌ Error general:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});






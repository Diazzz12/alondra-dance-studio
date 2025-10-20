// api/stripe-webhook.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const sig = req.headers['stripe-signature'];
  const body = req.body;

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata;
      
      console.log('=== Webhook Vercel recibido ===');
      console.log('Session:', session.id);
      console.log('Metadata:', meta);
      
      if (meta.item_type === 'tipo_reserva' && session.client_reference_id && meta.fecha && meta.franja_id && meta.tipo_reserva_id) {
        try {
          // Obtener número de barras del tipo de reserva
          const { data: tr, error: trError } = await supabase
            .from('tipos_reserva')
            .select('numero_barras')
            .eq('id', meta.tipo_reserva_id)
            .single();
            
          if (trError) {
            console.error('Error obteniendo tipo_reserva:', trError);
            return res.status(500).json({ error: 'Error obteniendo tipo_reserva' });
          }
          
          const numeroBarras = tr?.numero_barras ?? 1;
          
          // Crear reserva
          const { data: reservaData, error: reservaError } = await supabase
            .from('reservas')
            .insert({
              usuario_id: session.client_reference_id,
              fecha: meta.fecha,
              franja_horaria_id: Number(meta.franja_id),
              tipo_reserva_id: Number(meta.tipo_reserva_id),
              numero_barras: numeroBarras,
              metodo_pago: 'entrada',
              precio_pagado: session.amount_total / 100,
              estado: 'confirmada',
            })
            .select();
            
          if (reservaError) {
            console.error('Error insertando reserva:', reservaError);
            return res.status(500).json({ error: 'Error insertando reserva' });
          }
          
          console.log('Reserva creada exitosamente:', reservaData);
        } catch (e) {
          console.error('Error creando reserva:', e);
          return res.status(500).json({ error: 'Error creando reserva' });
        }
      }

      // Registrar pago
      const { error: payErr } = await supabase.from('pagos').insert({
        usuario_id: session.client_reference_id,
        tipo: meta.item_type === 'tipo_bono' ? 'bono' : 'entrada',
        referencia_id: Number(meta.item_id ?? 0),
        metodo_pago: 'stripe',
        cantidad: session.amount_total / 100,
        estado: 'completado',
        transaccion_id: session.id,
      });
      
      if (payErr) {
        console.error('Error insertando pago:', payErr);
      } else {
        console.log('Pago registrado exitosamente');
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
















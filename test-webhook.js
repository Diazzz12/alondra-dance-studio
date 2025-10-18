// Script para probar el webhook manualmente
const fetch = require('node-fetch');

async function testWebhook() {
  const webhookUrl = 'https://rdmznweegnutrmpfimoj.supabase.co/functions/v1/stripe-webhook';
  
  // Simular evento de Stripe
  const testEvent = {
    id: 'evt_test_webhook',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_manual',
        object: 'checkout.session',
        client_reference_id: 'ee788c57-8e3f-4850-b8b0-dc5c8ed81bc4',
        metadata: {
          item_type: 'tipo_reserva',
          item_id: '3',
          franja_id: '26',
          tipo_reserva_id: '3',
          fecha: '2025-10-08'
        },
        amount_total: 1000,
        payment_status: 'paid'
      }
    }
  };

  try {
    console.log('Enviando webhook de prueba...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // Esto fallará la verificación, pero veremos si llega
      },
      body: JSON.stringify(testEvent)
    });

    console.log('Status:', response.status);
    console.log('Response:', await response.text());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWebhook();


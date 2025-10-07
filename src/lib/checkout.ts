import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export type CheckoutParams = {
  itemType: "tipo_reserva" | "tipo_bono";
  itemId?: number;
  itemName?: string;
  couponCode?: string | null;
  successUrl: string;
  cancelUrl: string;
  fecha?: string;
  franjaId?: number;
  tipoReservaId?: number;
};

export async function startCheckout(params: CheckoutParams) {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Debes iniciar sesión");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-create-checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Fallo al iniciar checkout");
  const parsed = JSON.parse(text);
  if (!parsed?.url) throw new Error("Respuesta inválida del servidor");
  window.location.href = parsed.url as string;
}

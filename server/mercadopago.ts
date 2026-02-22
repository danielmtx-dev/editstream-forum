/**
 * Mercado Pago Integration
 * Creates payment preferences and handles webhooks
 * Access token can be configured via admin panel (siteSettings) or env var
 * Supports: PIX, Boleto and Credit/Debit Card
 */

import { getSetting } from "./db";

const MP_API_URL = "https://api.mercadopago.com";

/** Get the active MP access token - from DB settings first, then env fallback */
async function getAccessToken(): Promise<string> {
  const dbToken = await getSetting("mp_access_token");
  if (dbToken && dbToken.length > 10) return dbToken;
  const envToken = process.env.MP_ACCESS_TOKEN || "";
  return envToken;
}

interface CreatePreferenceInput {
  title: string;
  description: string;
  priceCents: number;
  externalReference: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
  notificationUrl: string;
  paymentMethod?: "pix" | "boleto" | "card" | "all";
}

interface PreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

/** Create a Mercado Pago payment preference */
export async function createPaymentPreference(input: CreatePreferenceInput): Promise<PreferenceResponse> {
  const token = await getAccessToken();
  if (!token || token.length < 10) {
    throw new Error("Mercado Pago Access Token não configurado");
  }

  // Build payment method exclusions based on selected method
  let paymentMethods: any = {};
  
  if (input.paymentMethod === "pix") {
    paymentMethods = {
      excluded_payment_types: [
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "ticket" },
        { id: "atm" },
      ],
      default_payment_method_id: "pix",
    };
  } else if (input.paymentMethod === "boleto") {
    paymentMethods = {
      excluded_payment_types: [
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "bank_transfer" },
        { id: "atm" },
      ],
    };
  } else if (input.paymentMethod === "card") {
    paymentMethods = {
      excluded_payment_types: [
        { id: "ticket" },
        { id: "bank_transfer" },
        { id: "atm" },
      ],
    };
  }
  // "all" = no exclusions, allow all methods

  const response = await fetch(`${MP_API_URL}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [{
        title: input.title,
        description: input.description.substring(0, 256),
        quantity: 1,
        currency_id: "BRL",
        unit_price: input.priceCents / 100,
      }],
      external_reference: input.externalReference,
      back_urls: input.backUrls,
      notification_url: input.notificationUrl,
      auto_return: "approved",
      payment_methods: paymentMethods,
      statement_descriptor: "EditStream Pro",
      expires: true,
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[MercadoPago] Create preference failed:", error);
    throw new Error("Falha ao criar preferência de pagamento");
  }

  return response.json();
}

/** Get payment details from Mercado Pago */
export async function getPaymentDetails(paymentId: string): Promise<any> {
  const token = await getAccessToken();
  if (!token || token.length < 10) {
    throw new Error("Mercado Pago Access Token não configurado");
  }

  const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[MercadoPago] Get payment failed:", error);
    throw new Error("Falha ao consultar pagamento");
  }

  return response.json();
}

/** Check if Mercado Pago is configured (from DB or env) */
export async function isMercadoPagoConfigured(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token && token.length > 10;
}

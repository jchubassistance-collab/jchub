// lib/payment.ts — Intégration CinetPay (MTN MoMo + Airtel Money pour Congo BZV)

const CINETPAY_API = 'https://api-checkout.cinetpay.com/v2';

export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';

export type PaymentRequest = {
  amount: number;            // en centimes (ex: 99900 = 999 FCFA)
  currency: 'XAF' | 'XOF';   // Franc CFA
  transactionId: string;     // ID unique (généré côté serveur)
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;     // format: 242XXXXXXXX (Congo BZV)
  paymentMethod: PaymentMethod;
  returnUrl: string;
  notifyUrl: string;         // webhook CinetPay
  metadata?: Record<string, any>;
};

export type PaymentResponse = {
  success: boolean;
  paymentUrl?: string;
  paymentToken?: string;
  error?: string;
};

/**
 * Initie un paiement CinetPay.
 * Retourne l'URL de paiement où rediriger l'utilisateur.
 */
export async function initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;

  if (!apiKey || !siteId) {
    return { success: false, error: 'CinetPay non configuré' };
  }

  try {
    const response = await fetch(`${CINETPAY_API}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: req.transactionId,
        amount: req.amount,
        currency: req.currency,
        description: req.description,
        customer_name: req.customerName,
        customer_email: req.customerEmail,
        customer_phone_number: req.customerPhone,
        customer_address: 'Congo Brazzaville',
        customer_city: 'Brazzaville',
        customer_country: 'CG',
        customer_state: 'CG',
        customer_zip_code: '00000',
        channels: req.paymentMethod === 'CARD' ? 'CREDIT_CARD' : req.paymentMethod,
        metadata: req.metadata || {},
        return_url: req.returnUrl,
        notify_url: req.notifyUrl,
        lang: 'fr',
      }),
    });

    const data = await response.json();

    if (data.code === '201') {
      return {
        success: true,
        paymentUrl: data.data.payment_url,
        paymentToken: data.data.payment_token,
      };
    }

    return { success: false, error: data.message || 'Erreur CinetPay' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Vérifie le statut d'une transaction (à appeler depuis le webhook).
 */
export async function verifyPayment(transactionId: string): Promise<{
  status: 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | 'PENDING';
  amount?: number;
  paymentMethod?: string;
  error?: string;
}> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;

  if (!apiKey || !siteId) {
    return { status: 'PENDING', error: 'CinetPay non configuré' };
  }

  try {
    const response = await fetch(`${CINETPAY_API}/payment/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: transactionId,
      }),
    });

    const data = await response.json();
    return {
      status: data.data?.status || 'PENDING',
      amount: data.data?.amount,
      paymentMethod: data.data?.payment_method,
    };
  } catch (error: any) {
    return { status: 'PENDING', error: error.message };
  }
}

/**
 * Génère un ID de transaction unique.
 */
export function generateTransactionId(prefix = 'JCH'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

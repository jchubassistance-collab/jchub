export type MtnEnvironment = 'sandbox' | 'production';

export function generateTransactionId(prefix = 'JCH'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export type MtnConfig = {
  baseUrl: string;
  apiUser: string;
  apiKey: string;
  subscriptionKey: string;
  callbackUrl: string;
  environment: MtnEnvironment;
};

export function getMtnConfig(): MtnConfig | null {
  const baseUrl = process.env.MTN_BASE_URL?.trim();
  const apiUser = (process.env.MTN_API_USER || process.env.MTN_CLIENT_ID)?.trim();
  const apiKey = (process.env.MTN_API_KEY || process.env.MTN_CLIENT_SECRET)?.trim();
  const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY?.trim();
  const callbackUrl = process.env.MTN_CALLBACK_URL?.trim() || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev'}/api/webhooks/mtn`;
  const environment = (process.env.MTN_ENV || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox';

  if (!baseUrl || !apiUser || !apiKey || !subscriptionKey) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiUser,
    apiKey,
    subscriptionKey,
    callbackUrl,
    environment,
  };
}

export async function getMtnAccessToken(): Promise<string | null> {
  const config = getMtnConfig();
  if (!config) return null;

  try {
    const authValue = Buffer.from(`${config.apiUser}:${config.apiKey}`).toString('base64');
    const response = await fetch(`${config.baseUrl}/collection/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authValue}`,
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MTN token error ${response.status}: ${text || 'Vérifie API User, API Key et Subscription Key'}`);
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('[MTN] token request failed:', error);
    throw error;
  }
}

export type MtnPaymentRequest = {
  amount: number;
  phone: string;
  transactionId: string;
  description: string;
  metadata?: Record<string, any>;
};

export type MtnPaymentResponse = {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
};

export async function initiateMtnPayment(req: MtnPaymentRequest): Promise<MtnPaymentResponse> {
  const config = getMtnConfig();
  if (!config) {
    return { success: false, error: 'MTN non configuré' };
  }

  try {
    const token = await getMtnAccessToken();
    if (!token) {
      return { success: false, error: 'Impossible d’obtenir le token MTN' };
    }

    const phone = req.phone.replace(/\D/g, '').replace(/^242/, '');
    const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': req.transactionId,
        'X-Target-Environment': config.environment,
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(req.amount),
        currency: 'XAF',
        externalId: req.transactionId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phone,
        },
        payerMessage: req.description,
        payeeNote: req.description,
      }),
    });

    if (response.status === 202 || response.status === 200) {
      return {
        success: true,
        transactionId: req.transactionId,
        paymentUrl: `${config.callbackUrl}?reference=${encodeURIComponent(req.transactionId)}`,
      };
    }

    const text = await response.text();
    return { success: false, error: text || 'Erreur MTN Mobile Money' };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erreur MTN Mobile Money' };
  }
}

export async function verifyMtnPayment(reference: string): Promise<{ status: string; amount?: number; error?: string }> {
  const config = getMtnConfig();
  if (!config) {
    return { status: 'PENDING', error: 'MTN non configuré' };
  }

  try {
    const token = await getMtnAccessToken();
    if (!token) {
      return { status: 'PENDING', error: 'Token MTN indisponible' };
    }

    const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': config.environment,
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      return { status: 'PENDING', error: text || 'Statut MTN indisponible' };
    }

    const data = text ? JSON.parse(text) : {};
    return {
      status: data.status || data.data?.status || 'PENDING',
      amount: Number(data.amount ?? data.data?.amount ?? 0),
    };
  } catch (error: any) {
    return { status: 'PENDING', error: error?.message || 'Erreur vérification MTN' };
  }
}

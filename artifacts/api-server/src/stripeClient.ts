import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';

// Fetches fresh credentials — never cache the result (tokens expire)
async function getStripeSecretKey(): Promise<string> {
  const connectorHostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replIdentity = process.env.REPL_IDENTITY;

  if (connectorHostname && replIdentity) {
    try {
      const resp = await fetch(
        `https://${connectorHostname}/v1/connections/ccfg_stripe_01K611P4YQR0SZM11XFRQJC44Y/token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${replIdentity}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (resp.ok) {
        const data = await resp.json() as any;
        const key = data?.credentials?.secret_key ?? data?.secret_key ?? data?.secretKey;
        if (key) return key;
      }
    } catch {
      // fall through to env var
    }
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured. Please connect the Stripe integration.');
  return key;
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const secretKey = await getStripeSecretKey();
  return new Stripe(secretKey, { apiVersion: '2024-06-20' as any });
}

let stripeSyncInstance: StripeSync | null = null;

export async function getStripeSync(): Promise<StripeSync> {
  if (stripeSyncInstance) return stripeSyncInstance;
  const secretKey = await getStripeSecretKey();
  stripeSyncInstance = new StripeSync({ secretKey });
  return stripeSyncInstance;
}

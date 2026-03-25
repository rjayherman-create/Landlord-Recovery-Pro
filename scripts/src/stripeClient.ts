import Stripe from 'stripe';

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
      // fall through
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

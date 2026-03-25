import Stripe from 'stripe';

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (hostname && xReplitToken) {
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set('include_secrets', 'true');
    url.searchParams.set('connector_names', 'stripe');
    url.searchParams.set('environment', 'development');

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'X-Replit-Token': xReplitToken },
    });

    const data = await response.json();
    const settings = data.items?.[0]?.settings;
    if (settings?.secret) {
      return { secretKey: settings.secret, publishableKey: settings.publishable };
    }
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured. Connect the Stripe integration.');
  return { secretKey: key, publishableKey: '' };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' as any });
}

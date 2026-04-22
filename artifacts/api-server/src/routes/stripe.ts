import { Router, type IRouter } from 'express';
import { stripeStorage } from '../stripeStorage';
import { stripeService } from '../stripeService';

const router: IRouter = Router();

router.get('/stripe/products', async (_req, res) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();
    const map = new Map<string, any>();
    for (const row of rows) {
      if (!map.has(row.product_id as string)) {
        map.set(row.product_id as string, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        map.get(row.product_id as string).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
        });
      }
    }
    res.json({ data: Array.from(map.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stripe/checkout', async (req: any, res) => {
  try {
    const { priceId, email, successPath, cancelPath } = req.body as {
      priceId: string;
      email?: string;
      successPath?: string;
      cancelPath?: string;
    };
    if (!priceId) return res.status(400).json({ error: 'priceId is required' });

    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const session = await stripeService.createGuestCheckoutSession({
      priceId,
      email,
      successUrl: `${baseUrl}${successPath ?? '/landlord-recovery/checkout/success'}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}${cancelPath ?? '/landlord-recovery/checkout/cancel'}`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stripe/seed-products', async (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  try {
    const stripe = await (await import('../stripeClient.js')).getUncachableStripeClient();
    const existing = await stripe.products.search({ query: "name:'Recovery Pro' AND active:'true'" });
    if (existing.data.length > 0) {
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      return res.json({ status: 'already_exists', productId: existing.data[0].id, prices: prices.data.map(p => ({ id: p.id, amount: p.unit_amount })) });
    }
    const product = await stripe.products.create({
      name: 'Recovery Pro',
      description: 'Full-year access to AI demand letters, premium PDF exports, and court-specific filing instructions.',
      metadata: { plan: 'pro' },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 9900,
      currency: 'usd',
    });
    res.json({ status: 'created', productId: product.id, priceId: price.id, amount: price.unit_amount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stripe/me', async (_req, res) => {
  // Auth removed — all users have the basic plan included
  res.json({ plan: 'basic' });
});

export default router;

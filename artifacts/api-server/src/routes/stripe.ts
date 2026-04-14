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
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { priceId } = req.body as { priceId: string };
    if (!priceId) return res.status(400).json({ error: 'priceId is required' });

    const customerId = await stripeService.createOrGetCustomer(req.user.id, req.user.email);

    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const session = await stripeService.createCheckoutSession({
      customerId,
      priceId,
      userId: req.user.id,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/checkout/cancel`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stripe/me', async (req: any, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await stripeStorage.getUser(req.user.id);
    res.json({ plan: user?.plan ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

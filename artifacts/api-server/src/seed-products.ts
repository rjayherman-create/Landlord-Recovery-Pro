import { getUncachableStripeClient } from './stripeClient.js';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({
    query: "name:'Recovery Pro' AND active:'true'",
  });

  if (existing.data.length > 0) {
    console.log(`Recovery Pro already exists: ${existing.data[0].id}`);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    prices.data.forEach(p => console.log(`  Price: ${p.id} — $${(p.unit_amount ?? 0) / 100}`));
    return;
  }

  const product = await stripe.products.create({
    name: 'Recovery Pro',
    description: 'Full-year access to AI demand letters, premium PDF exports, and court-specific filing instructions.',
    metadata: { plan: 'pro', tier: 'recovery_pro' },
  });
  console.log(`Created product: ${product.name} (${product.id})`);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 9900,
    currency: 'usd',
  });
  console.log(`Created price: $99.00 one-time (${price.id})`);

  console.log('Done. Webhooks will sync this to the database automatically.');
}

seedProducts().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

import { getUncachableStripeClient } from './stripeClient';

const PLANS = [
  {
    name: 'TaxAppeal DIY — Basic',
    description: 'Everything you need to file your own appeal. Pre-filled state forms (RP-524, A-1, Notice of Protest, DR-486), comparable sales report, and step-by-step guidance.',
    amount: 9999,
    metadata: { plan: 'basic', highlight: 'Most Popular' },
  },
  {
    name: 'TaxAppeal DIY — Guided',
    description: 'Everything in Basic plus a detailed review checklist, county-specific filing instructions, and priority email support to answer your questions before you file.',
    amount: 19900,
    metadata: { plan: 'guided', highlight: '' },
  },
  {
    name: 'TaxAppeal DIY — Concierge',
    description: 'We review your comparables and forms before you submit. Includes a 30-minute video call with a property tax specialist to strengthen your case.',
    amount: 29900,
    metadata: { plan: 'concierge', highlight: 'Best Value' },
  },
];

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  for (const plan of PLANS) {
    const existing = await stripe.products.search({
      query: `name:'${plan.name}' AND active:'true'`,
    });

    if (existing.data.length > 0) {
      console.log(`✓ Already exists: ${plan.name} (${existing.data[0].id})`);
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      prices.data.forEach(p => console.log(`  price: ${p.id} — $${(p.unit_amount! / 100).toFixed(2)}`));
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'usd',
    });

    console.log(`✓ Created: ${product.name} (${product.id})`);
    console.log(`  price: ${price.id} — $${(plan.amount / 100).toFixed(2)}`);
  }

  console.log('\nDone. Webhooks will sync data to your database automatically.');
}

seedProducts().catch(err => {
  console.error(err.message);
  process.exit(1);
});

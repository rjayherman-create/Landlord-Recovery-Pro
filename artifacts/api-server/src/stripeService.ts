import { stripeStorage } from './stripeStorage';
import { getUncachableStripeClient } from './stripeClient';

export class StripeService {
  async createOrGetCustomer(userId: string, email: string | null | undefined) {
    const user = await stripeStorage.getUser(userId);
    if (user?.stripeCustomerId) return user.stripeCustomerId;

    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { userId },
    });

    await stripeStorage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
    return customer.id;
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const stripe = await getUncachableStripeClient();
    return stripe.checkout.sessions.create({
      customer: params.customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { userId: params.userId },
    });
  }
}

export const stripeService = new StripeService();

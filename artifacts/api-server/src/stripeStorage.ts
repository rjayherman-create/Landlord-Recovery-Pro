import { db, usersTable } from '@workspace/db';
import { eq, sql } from 'drizzle-orm';

export class StripeStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  }

  async updateUserStripeInfo(userId: string, info: { stripeCustomerId?: string; plan?: string }) {
    const [user] = await db
      .update(usersTable)
      .set(info)
      .where(eq(usersTable.id, userId))
      .returning();
    return user;
  }

  async listProductsWithPrices() {
    const result = await db.execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY name
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.active as price_active
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY pr.unit_amount ASC
    `);
    return result.rows;
  }

  async getPaymentByIntentId(paymentIntentId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.payment_intents WHERE id = ${paymentIntentId}`
    );
    return result.rows[0] ?? null;
  }
}

export const stripeStorage = new StripeStorage();

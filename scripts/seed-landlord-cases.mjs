/**
 * Seed script: inserts sample landlord cases into the target database.
 * Usage (Railway):
 *   railway run node scripts/seed-landlord-cases.mjs
 * Usage (any Postgres URL):
 *   DATABASE_URL=postgres://... node scripts/seed-landlord-cases.mjs
 */

import pg from "pg";

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SEED_SQL = `
-- Clear existing sample data and reset sequence
TRUNCATE landlord_cases RESTART IDENTITY CASCADE;

-- Insert sample cases
INSERT INTO landlord_cases (
  id, claim_type, state, landlord_name, landlord_email, landlord_phone,
  tenant_name, tenant_email, tenant_phone, tenant_address, property_address,
  monthly_rent, claim_amount, description, lease_start_date, lease_end_date,
  move_out_date, status, judgment_amount, recovered_amount, notes,
  created_at, updated_at, months_owed, archived, rent_period
) OVERRIDING SYSTEM VALUE VALUES

(1, 'unpaid_rent', 'NY', 'Michael Torres', 'michael@example.com', NULL,
 'Sarah Johnson', 'sarah.j@email.com', '(917) 555-0142',
 '88 Flatbush Ave, Brooklyn, NY 11201',
 '245 Atlantic Ave, Apt 3B, Brooklyn, NY 11201',
 2400.00, 7200.00,
 'Tenant stopped paying rent in January. Three months of unpaid rent totaling $7,200. Multiple notices sent with no response.',
 '2023-01-01', '2023-12-31', '2024-03-31',
 'draft', NULL, 0.00,
 'Last contact was February 14. Certified mail delivered.',
 '2026-04-21 19:49:45', '2026-04-22 12:20:28', 3, false, 'January – March 2024'),

(2, 'property_damage', 'NY', 'Michael Torres', 'michael@example.com', NULL,
 'David Kim', NULL, '(718) 555-0287',
 '14 Ocean Ave, Brooklyn, NY 11225',
 '14 Ocean Ave, Unit 1, Brooklyn, NY 11225',
 1800.00, 4350.00,
 'Tenant caused significant damage to the kitchen and bathroom. Holes in walls, broken fixtures, damaged flooring beyond normal wear and tear.',
 '2022-06-01', '2023-05-31', '2023-06-15',
 'filed', NULL, NULL,
 'Photos and contractor estimate documented. Security deposit of $1,800 applied.',
 '2026-04-21 19:49:45', '2026-04-22 12:45:35', NULL, false, NULL),

(3, 'security_deposit', 'NJ', 'Linda Patel', 'linda.p@realty.com', NULL,
 'James Wilson', 'jwilson@email.com', '(201) 555-0391',
 '22 Maple Street, Newark, NJ 07102',
 '55 Park Place, Unit 4C, Newark, NJ 07102',
 1500.00, 3000.00,
 'Tenant vacated in good condition but landlord refused to return $3,000 security deposit without justification.',
 '2022-09-01', '2024-08-31', '2024-09-01',
 'no_response', NULL, NULL,
 'Court date set for May 15, 2025. All documentation prepared.',
 '2026-04-21 19:49:45', '2026-04-22 19:32:06', NULL, false, NULL),

(4, 'unpaid_rent', 'TX', 'Robert Chen', 'rchen@properties.com', NULL,
 'Emma Davis', 'emma.d@gmail.com', NULL,
 NULL,
 '7821 Westheimer Rd, Houston, TX 77063',
 1950.00, 3900.00,
 'Tenant abandoned the property with two months rent outstanding. Left personal belongings behind.',
 '2023-04-01', '2024-03-31', '2024-02-01',
 'judgment', 3900.00, 3900.00,
 'Won in court. Judgment entered for full amount. Working with collection agency.',
 '2026-04-21 19:49:45', '2026-04-21 19:49:45', 2, false, 'February – March 2024'),

(5, 'lease_break', 'FL', 'Linda Patel', 'linda.p@realty.com', NULL,
 'Carlos Martinez', 'cmart@email.com', '(305) 555-0512',
 '901 Brickell Key Dr, Miami, FL 33131',
 '1200 Biscayne Blvd, Unit 800, Miami, FL 33132',
 3200.00, 6400.00,
 'Tenant broke 12-month lease after 4 months with no notice. Two months rent as lease break fee per lease agreement.',
 '2024-01-01', '2024-12-31', '2024-05-01',
 'closed', NULL, 3200.00,
 'Settled for partial amount. Case resolved.',
 '2026-04-21 19:49:45', '2026-04-21 19:49:45', NULL, false, NULL);

-- Reset sequence so the next INSERT gets id = 6
SELECT setval(pg_get_serial_sequence('landlord_cases', 'id'), (SELECT MAX(id) FROM landlord_cases));
`;

async function run() {
  console.log("Connecting to database…");
  await client.connect();
  console.log("Connected. Running seed…");
  try {
    await client.query(SEED_SQL);
    const { rows } = await client.query("SELECT COUNT(*) AS total FROM landlord_cases;");
    console.log(`✓ Done. ${rows[0].total} cases now in landlord_cases.`);
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});

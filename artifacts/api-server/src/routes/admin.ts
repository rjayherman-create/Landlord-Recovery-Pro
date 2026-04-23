import { Router } from "express";
import { db, landlordCases } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const samples = [
  {
    claimType: "unpaid_rent",
    state: "NY",
    landlordName: "Michael Torres",
    landlordEmail: "michael@example.com",
    tenantName: "Sarah Johnson",
    tenantEmail: "sarah.j@email.com",
    tenantPhone: "(917) 555-0142",
    tenantAddress: "88 Flatbush Ave, Brooklyn, NY 11201",
    propertyAddress: "245 Atlantic Ave, Apt 3B, Brooklyn, NY 11201",
    monthlyRent: "2400.00",
    claimAmount: "7200.00",
    description: "Tenant stopped paying rent in January. Three months of unpaid rent totaling $7,200. Multiple notices sent with no response.",
    leaseStartDate: "2023-01-01",
    leaseEndDate: "2023-12-31",
    moveOutDate: "2024-03-31",
    status: "draft",
    recoveredAmount: "0.00",
    notes: "Last contact was February 14. Certified mail delivered.",
    monthsOwed: 3,
    rentPeriod: "January – March 2024",
  },
  {
    claimType: "property_damage",
    state: "NY",
    landlordName: "Michael Torres",
    landlordEmail: "michael@example.com",
    tenantName: "David Kim",
    tenantPhone: "(718) 555-0287",
    tenantAddress: "14 Ocean Ave, Brooklyn, NY 11225",
    propertyAddress: "14 Ocean Ave, Unit 1, Brooklyn, NY 11225",
    monthlyRent: "1800.00",
    claimAmount: "4350.00",
    description: "Tenant caused significant damage to the kitchen and bathroom. Holes in walls, broken fixtures, damaged flooring beyond normal wear and tear.",
    leaseStartDate: "2022-06-01",
    leaseEndDate: "2023-05-31",
    moveOutDate: "2023-06-15",
    status: "filed",
    notes: "Photos and contractor estimate documented. Security deposit of $1,800 applied.",
  },
  {
    claimType: "security_deposit",
    state: "NJ",
    landlordName: "Linda Patel",
    landlordEmail: "linda.p@realty.com",
    tenantName: "James Wilson",
    tenantEmail: "jwilson@email.com",
    tenantPhone: "(201) 555-0391",
    tenantAddress: "22 Maple Street, Newark, NJ 07102",
    propertyAddress: "55 Park Place, Unit 4C, Newark, NJ 07102",
    monthlyRent: "1500.00",
    claimAmount: "3000.00",
    description: "Tenant vacated in good condition but landlord refused to return $3,000 security deposit without justification.",
    leaseStartDate: "2022-09-01",
    leaseEndDate: "2024-08-31",
    moveOutDate: "2024-09-01",
    status: "no_response",
    notes: "Court date set for May 15, 2025. All documentation prepared.",
  },
  {
    claimType: "unpaid_rent",
    state: "TX",
    landlordName: "Robert Chen",
    landlordEmail: "rchen@properties.com",
    tenantName: "Emma Davis",
    tenantEmail: "emma.d@gmail.com",
    propertyAddress: "7821 Westheimer Rd, Houston, TX 77063",
    monthlyRent: "1950.00",
    claimAmount: "3900.00",
    description: "Tenant abandoned the property with two months rent outstanding. Left personal belongings behind.",
    leaseStartDate: "2023-04-01",
    leaseEndDate: "2024-03-31",
    moveOutDate: "2024-02-01",
    status: "judgment",
    judgmentAmount: "3900.00",
    recoveredAmount: "3900.00",
    notes: "Won in court. Judgment entered for full amount. Working with collection agency.",
    monthsOwed: 2,
    rentPeriod: "February – March 2024",
  },
  {
    claimType: "lease_break",
    state: "FL",
    landlordName: "Linda Patel",
    landlordEmail: "linda.p@realty.com",
    tenantName: "Carlos Martinez",
    tenantEmail: "cmart@email.com",
    tenantPhone: "(305) 555-0512",
    tenantAddress: "901 Brickell Key Dr, Miami, FL 33131",
    propertyAddress: "1200 Biscayne Blvd, Unit 800, Miami, FL 33132",
    monthlyRent: "3200.00",
    claimAmount: "6400.00",
    description: "Tenant broke 12-month lease after 4 months with no notice. Two months rent as lease break fee per lease agreement.",
    leaseStartDate: "2024-01-01",
    leaseEndDate: "2024-12-31",
    moveOutDate: "2024-05-01",
    status: "closed",
    recoveredAmount: "3200.00",
    notes: "Settled for partial amount. Case resolved.",
  },
];

router.post("/admin/seed-landlord-cases", async (req, res) => {
  const adminKey = process.env.ADMIN_SECRET;
  const provided = req.headers["x-admin-key"];

  if (!adminKey || provided !== adminKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("Admin seed: truncating landlord_cases…");
    await db.execute(sql`TRUNCATE landlord_cases RESTART IDENTITY CASCADE`);

    const inserted: string[] = [];
    for (const s of samples) {
      await db.insert(landlordCases).values(s as any);
      inserted.push(`${s.tenantName} (${s.state} — ${s.status})`);
    }

    logger.info({ inserted }, "Admin seed: complete");
    res.json({ success: true, inserted });
  } catch (err: any) {
    logger.error({ err }, "Admin seed failed");
    res.status(500).json({ error: err.message });
  }
});

export default router;

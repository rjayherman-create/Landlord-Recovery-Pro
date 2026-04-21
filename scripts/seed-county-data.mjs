/**
 * Seed county_data table with tax rates and equalization rates for NY, NJ, TX, FL.
 */
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const COUNTY_DATA = [
  // NEW YORK
  { state: "NY", county: "Albany", tax_rate: 0.0182, equalization_rate: 0.85 },
  { state: "NY", county: "Allegany", tax_rate: 0.0285, equalization_rate: 0.72 },
  { state: "NY", county: "Bronx", tax_rate: 0.0120, equalization_rate: 1.00 },
  { state: "NY", county: "Broome", tax_rate: 0.0310, equalization_rate: 0.78 },
  { state: "NY", county: "Cattaraugus", tax_rate: 0.0262, equalization_rate: 0.75 },
  { state: "NY", county: "Cayuga", tax_rate: 0.0258, equalization_rate: 0.73 },
  { state: "NY", county: "Chautauqua", tax_rate: 0.0291, equalization_rate: 0.74 },
  { state: "NY", county: "Chemung", tax_rate: 0.0299, equalization_rate: 0.76 },
  { state: "NY", county: "Chenango", tax_rate: 0.0271, equalization_rate: 0.70 },
  { state: "NY", county: "Clinton", tax_rate: 0.0249, equalization_rate: 0.82 },
  { state: "NY", county: "Columbia", tax_rate: 0.0216, equalization_rate: 0.80 },
  { state: "NY", county: "Cortland", tax_rate: 0.0276, equalization_rate: 0.74 },
  { state: "NY", county: "Delaware", tax_rate: 0.0237, equalization_rate: 0.71 },
  { state: "NY", county: "Dutchess", tax_rate: 0.0209, equalization_rate: 0.83 },
  { state: "NY", county: "Erie", tax_rate: 0.0274, equalization_rate: 0.80 },
  { state: "NY", county: "Essex", tax_rate: 0.0221, equalization_rate: 0.78 },
  { state: "NY", county: "Franklin", tax_rate: 0.0242, equalization_rate: 0.75 },
  { state: "NY", county: "Fulton", tax_rate: 0.0284, equalization_rate: 0.73 },
  { state: "NY", county: "Genesee", tax_rate: 0.0267, equalization_rate: 0.77 },
  { state: "NY", county: "Greene", tax_rate: 0.0219, equalization_rate: 0.79 },
  { state: "NY", county: "Hamilton", tax_rate: 0.0193, equalization_rate: 0.69 },
  { state: "NY", county: "Herkimer", tax_rate: 0.0271, equalization_rate: 0.72 },
  { state: "NY", county: "Jefferson", tax_rate: 0.0257, equalization_rate: 0.79 },
  { state: "NY", county: "Kings", tax_rate: 0.0113, equalization_rate: 1.00 },
  { state: "NY", county: "Lewis", tax_rate: 0.0248, equalization_rate: 0.71 },
  { state: "NY", county: "Livingston", tax_rate: 0.0256, equalization_rate: 0.78 },
  { state: "NY", county: "Madison", tax_rate: 0.0263, equalization_rate: 0.76 },
  { state: "NY", county: "Monroe", tax_rate: 0.0230, equalization_rate: 0.82 },
  { state: "NY", county: "Montgomery", tax_rate: 0.0281, equalization_rate: 0.72 },
  { state: "NY", county: "Nassau", tax_rate: 0.0106, equalization_rate: 0.25 },
  { state: "NY", county: "New York", tax_rate: 0.0125, equalization_rate: 1.00 },
  { state: "NY", county: "Niagara", tax_rate: 0.0285, equalization_rate: 0.78 },
  { state: "NY", county: "Oneida", tax_rate: 0.0274, equalization_rate: 0.77 },
  { state: "NY", county: "Onondaga", tax_rate: 0.0256, equalization_rate: 0.82 },
  { state: "NY", county: "Ontario", tax_rate: 0.0234, equalization_rate: 0.80 },
  { state: "NY", county: "Orange", tax_rate: 0.0211, equalization_rate: 0.84 },
  { state: "NY", county: "Orleans", tax_rate: 0.0278, equalization_rate: 0.75 },
  { state: "NY", county: "Oswego", tax_rate: 0.0269, equalization_rate: 0.76 },
  { state: "NY", county: "Otsego", tax_rate: 0.0251, equalization_rate: 0.73 },
  { state: "NY", county: "Putnam", tax_rate: 0.0201, equalization_rate: 0.86 },
  { state: "NY", county: "Queens", tax_rate: 0.0116, equalization_rate: 1.00 },
  { state: "NY", county: "Rensselaer", tax_rate: 0.0223, equalization_rate: 0.84 },
  { state: "NY", county: "Richmond", tax_rate: 0.0120, equalization_rate: 1.00 },
  { state: "NY", county: "Rockland", tax_rate: 0.0188, equalization_rate: 0.87 },
  { state: "NY", county: "St. Lawrence", tax_rate: 0.0259, equalization_rate: 0.72 },
  { state: "NY", county: "Saratoga", tax_rate: 0.0196, equalization_rate: 0.83 },
  { state: "NY", county: "Schenectady", tax_rate: 0.0241, equalization_rate: 0.82 },
  { state: "NY", county: "Schoharie", tax_rate: 0.0248, equalization_rate: 0.73 },
  { state: "NY", county: "Schuyler", tax_rate: 0.0253, equalization_rate: 0.72 },
  { state: "NY", county: "Seneca", tax_rate: 0.0261, equalization_rate: 0.75 },
  { state: "NY", county: "Steuben", tax_rate: 0.0268, equalization_rate: 0.73 },
  { state: "NY", county: "Suffolk", tax_rate: 0.0157, equalization_rate: 0.75 },
  { state: "NY", county: "Sullivan", tax_rate: 0.0226, equalization_rate: 0.78 },
  { state: "NY", county: "Tioga", tax_rate: 0.0272, equalization_rate: 0.75 },
  { state: "NY", county: "Tompkins", tax_rate: 0.0225, equalization_rate: 0.82 },
  { state: "NY", county: "Ulster", tax_rate: 0.0213, equalization_rate: 0.83 },
  { state: "NY", county: "Warren", tax_rate: 0.0218, equalization_rate: 0.80 },
  { state: "NY", county: "Washington", tax_rate: 0.0241, equalization_rate: 0.77 },
  { state: "NY", county: "Wayne", tax_rate: 0.0253, equalization_rate: 0.79 },
  { state: "NY", county: "Westchester", tax_rate: 0.0194, equalization_rate: 0.88 },
  { state: "NY", county: "Wyoming", tax_rate: 0.0271, equalization_rate: 0.74 },
  { state: "NY", county: "Yates", tax_rate: 0.0247, equalization_rate: 0.76 },

  // NEW JERSEY
  { state: "NJ", county: "Atlantic", tax_rate: 0.0262, equalization_rate: 1.00 },
  { state: "NJ", county: "Bergen", tax_rate: 0.0205, equalization_rate: 1.00 },
  { state: "NJ", county: "Burlington", tax_rate: 0.0233, equalization_rate: 1.00 },
  { state: "NJ", county: "Camden", tax_rate: 0.0298, equalization_rate: 1.00 },
  { state: "NJ", county: "Cape May", tax_rate: 0.0161, equalization_rate: 1.00 },
  { state: "NJ", county: "Cumberland", tax_rate: 0.0326, equalization_rate: 1.00 },
  { state: "NJ", county: "Essex", tax_rate: 0.0356, equalization_rate: 1.00 },
  { state: "NJ", county: "Gloucester", tax_rate: 0.0258, equalization_rate: 1.00 },
  { state: "NJ", county: "Hudson", tax_rate: 0.0279, equalization_rate: 1.00 },
  { state: "NJ", county: "Hunterdon", tax_rate: 0.0202, equalization_rate: 1.00 },
  { state: "NJ", county: "Mercer", tax_rate: 0.0264, equalization_rate: 1.00 },
  { state: "NJ", county: "Middlesex", tax_rate: 0.0244, equalization_rate: 1.00 },
  { state: "NJ", county: "Monmouth", tax_rate: 0.0208, equalization_rate: 1.00 },
  { state: "NJ", county: "Morris", tax_rate: 0.0209, equalization_rate: 1.00 },
  { state: "NJ", county: "Ocean", tax_rate: 0.0202, equalization_rate: 1.00 },
  { state: "NJ", county: "Passaic", tax_rate: 0.0299, equalization_rate: 1.00 },
  { state: "NJ", county: "Salem", tax_rate: 0.0308, equalization_rate: 1.00 },
  { state: "NJ", county: "Somerset", tax_rate: 0.0218, equalization_rate: 1.00 },
  { state: "NJ", county: "Sussex", tax_rate: 0.0222, equalization_rate: 1.00 },
  { state: "NJ", county: "Union", tax_rate: 0.0292, equalization_rate: 1.00 },
  { state: "NJ", county: "Warren", tax_rate: 0.0248, equalization_rate: 1.00 },

  // TEXAS
  { state: "TX", county: "Anderson", tax_rate: 0.0168, equalization_rate: 1.00 },
  { state: "TX", county: "Andrews", tax_rate: 0.0151, equalization_rate: 1.00 },
  { state: "TX", county: "Angelina", tax_rate: 0.0172, equalization_rate: 1.00 },
  { state: "TX", county: "Aransas", tax_rate: 0.0147, equalization_rate: 1.00 },
  { state: "TX", county: "Austin", tax_rate: 0.0155, equalization_rate: 1.00 },
  { state: "TX", county: "Bastrop", tax_rate: 0.0192, equalization_rate: 1.00 },
  { state: "TX", county: "Bexar", tax_rate: 0.0219, equalization_rate: 1.00 },
  { state: "TX", county: "Bowie", tax_rate: 0.0176, equalization_rate: 1.00 },
  { state: "TX", county: "Brazoria", tax_rate: 0.0208, equalization_rate: 1.00 },
  { state: "TX", county: "Brazos", tax_rate: 0.0191, equalization_rate: 1.00 },
  { state: "TX", county: "Cameron", tax_rate: 0.0224, equalization_rate: 1.00 },
  { state: "TX", county: "Comal", tax_rate: 0.0178, equalization_rate: 1.00 },
  { state: "TX", county: "Collin", tax_rate: 0.0198, equalization_rate: 1.00 },
  { state: "TX", county: "Dallas", tax_rate: 0.0214, equalization_rate: 1.00 },
  { state: "TX", county: "Denton", tax_rate: 0.0201, equalization_rate: 1.00 },
  { state: "TX", county: "El Paso", tax_rate: 0.0231, equalization_rate: 1.00 },
  { state: "TX", county: "Ellis", tax_rate: 0.0184, equalization_rate: 1.00 },
  { state: "TX", county: "Fort Bend", tax_rate: 0.0212, equalization_rate: 1.00 },
  { state: "TX", county: "Galveston", tax_rate: 0.0194, equalization_rate: 1.00 },
  { state: "TX", county: "Grayson", tax_rate: 0.0179, equalization_rate: 1.00 },
  { state: "TX", county: "Guadalupe", tax_rate: 0.0185, equalization_rate: 1.00 },
  { state: "TX", county: "Hays", tax_rate: 0.0197, equalization_rate: 1.00 },
  { state: "TX", county: "Hidalgo", tax_rate: 0.0228, equalization_rate: 1.00 },
  { state: "TX", county: "Hood", tax_rate: 0.0171, equalization_rate: 1.00 },
  { state: "TX", county: "Hunt", tax_rate: 0.0182, equalization_rate: 1.00 },
  { state: "TX", county: "Johnson", tax_rate: 0.0188, equalization_rate: 1.00 },
  { state: "TX", county: "Kaufman", tax_rate: 0.0191, equalization_rate: 1.00 },
  { state: "TX", county: "Lubbock", tax_rate: 0.0211, equalization_rate: 1.00 },
  { state: "TX", county: "McLennan", tax_rate: 0.0198, equalization_rate: 1.00 },
  { state: "TX", county: "Montgomery", tax_rate: 0.0196, equalization_rate: 1.00 },
  { state: "TX", county: "Nueces", tax_rate: 0.0208, equalization_rate: 1.00 },
  { state: "TX", county: "Parker", tax_rate: 0.0178, equalization_rate: 1.00 },
  { state: "TX", county: "Rockwall", tax_rate: 0.0194, equalization_rate: 1.00 },
  { state: "TX", county: "Smith", tax_rate: 0.0188, equalization_rate: 1.00 },
  { state: "TX", county: "Tarrant", tax_rate: 0.0220, equalization_rate: 1.00 },
  { state: "TX", county: "Travis", tax_rate: 0.0195, equalization_rate: 1.00 },
  { state: "TX", county: "Tom Green", tax_rate: 0.0186, equalization_rate: 1.00 },
  { state: "TX", county: "Victoria", tax_rate: 0.0189, equalization_rate: 1.00 },
  { state: "TX", county: "Webb", tax_rate: 0.0234, equalization_rate: 1.00 },
  { state: "TX", county: "Wichita", tax_rate: 0.0203, equalization_rate: 1.00 },
  { state: "TX", county: "Williamson", tax_rate: 0.0196, equalization_rate: 1.00 },

  // FLORIDA
  { state: "FL", county: "Alachua", tax_rate: 0.0108, equalization_rate: 1.00 },
  { state: "FL", county: "Baker", tax_rate: 0.0091, equalization_rate: 1.00 },
  { state: "FL", county: "Bay", tax_rate: 0.0088, equalization_rate: 1.00 },
  { state: "FL", county: "Bradford", tax_rate: 0.0096, equalization_rate: 1.00 },
  { state: "FL", county: "Brevard", tax_rate: 0.0094, equalization_rate: 1.00 },
  { state: "FL", county: "Broward", tax_rate: 0.0099, equalization_rate: 1.00 },
  { state: "FL", county: "Calhoun", tax_rate: 0.0087, equalization_rate: 1.00 },
  { state: "FL", county: "Charlotte", tax_rate: 0.0090, equalization_rate: 1.00 },
  { state: "FL", county: "Citrus", tax_rate: 0.0093, equalization_rate: 1.00 },
  { state: "FL", county: "Clay", tax_rate: 0.0095, equalization_rate: 1.00 },
  { state: "FL", county: "Collier", tax_rate: 0.0072, equalization_rate: 1.00 },
  { state: "FL", county: "Columbia", tax_rate: 0.0098, equalization_rate: 1.00 },
  { state: "FL", county: "DeSoto", tax_rate: 0.0102, equalization_rate: 1.00 },
  { state: "FL", county: "Dixie", tax_rate: 0.0088, equalization_rate: 1.00 },
  { state: "FL", county: "Duval", tax_rate: 0.0101, equalization_rate: 1.00 },
  { state: "FL", county: "Escambia", tax_rate: 0.0097, equalization_rate: 1.00 },
  { state: "FL", county: "Flagler", tax_rate: 0.0092, equalization_rate: 1.00 },
  { state: "FL", county: "Franklin", tax_rate: 0.0083, equalization_rate: 1.00 },
  { state: "FL", county: "Gadsden", tax_rate: 0.0105, equalization_rate: 1.00 },
  { state: "FL", county: "Gilchrist", tax_rate: 0.0089, equalization_rate: 1.00 },
  { state: "FL", county: "Gulf", tax_rate: 0.0085, equalization_rate: 1.00 },
  { state: "FL", county: "Hardee", tax_rate: 0.0099, equalization_rate: 1.00 },
  { state: "FL", county: "Hendry", tax_rate: 0.0096, equalization_rate: 1.00 },
  { state: "FL", county: "Hernando", tax_rate: 0.0097, equalization_rate: 1.00 },
  { state: "FL", county: "Highlands", tax_rate: 0.0093, equalization_rate: 1.00 },
  { state: "FL", county: "Hillsborough", tax_rate: 0.0101, equalization_rate: 1.00 },
  { state: "FL", county: "Holmes", tax_rate: 0.0088, equalization_rate: 1.00 },
  { state: "FL", county: "Indian River", tax_rate: 0.0090, equalization_rate: 1.00 },
  { state: "FL", county: "Jackson", tax_rate: 0.0094, equalization_rate: 1.00 },
  { state: "FL", county: "Jefferson", tax_rate: 0.0096, equalization_rate: 1.00 },
  { state: "FL", county: "Lake", tax_rate: 0.0097, equalization_rate: 1.00 },
  { state: "FL", county: "Lee", tax_rate: 0.0091, equalization_rate: 1.00 },
  { state: "FL", county: "Leon", tax_rate: 0.0101, equalization_rate: 1.00 },
  { state: "FL", county: "Levy", tax_rate: 0.0095, equalization_rate: 1.00 },
  { state: "FL", county: "Liberty", tax_rate: 0.0082, equalization_rate: 1.00 },
  { state: "FL", county: "Madison", tax_rate: 0.0097, equalization_rate: 1.00 },
  { state: "FL", county: "Manatee", tax_rate: 0.0093, equalization_rate: 1.00 },
  { state: "FL", county: "Marion", tax_rate: 0.0098, equalization_rate: 1.00 },
  { state: "FL", county: "Martin", tax_rate: 0.0088, equalization_rate: 1.00 },
  { state: "FL", county: "Miami-Dade", tax_rate: 0.0100, equalization_rate: 1.00 },
  { state: "FL", county: "Monroe", tax_rate: 0.0077, equalization_rate: 1.00 },
  { state: "FL", county: "Nassau", tax_rate: 0.0092, equalization_rate: 1.00 },
  { state: "FL", county: "Okaloosa", tax_rate: 0.0086, equalization_rate: 1.00 },
  { state: "FL", county: "Okeechobee", tax_rate: 0.0100, equalization_rate: 1.00 },
  { state: "FL", county: "Orange", tax_rate: 0.0099, equalization_rate: 1.00 },
  { state: "FL", county: "Osceola", tax_rate: 0.0102, equalization_rate: 1.00 },
  { state: "FL", county: "Palm Beach", tax_rate: 0.0094, equalization_rate: 1.00 },
  { state: "FL", county: "Pasco", tax_rate: 0.0101, equalization_rate: 1.00 },
  { state: "FL", county: "Pinellas", tax_rate: 0.0097, equalization_rate: 1.00 },
  { state: "FL", county: "Polk", tax_rate: 0.0100, equalization_rate: 1.00 },
  { state: "FL", county: "Putnam", tax_rate: 0.0105, equalization_rate: 1.00 },
  { state: "FL", county: "St. Johns", tax_rate: 0.0088, equalization_rate: 1.00 },
  { state: "FL", county: "St. Lucie", tax_rate: 0.0099, equalization_rate: 1.00 },
  { state: "FL", county: "Santa Rosa", tax_rate: 0.0090, equalization_rate: 1.00 },
  { state: "FL", county: "Sarasota", tax_rate: 0.0091, equalization_rate: 1.00 },
  { state: "FL", county: "Seminole", tax_rate: 0.0094, equalization_rate: 1.00 },
  { state: "FL", county: "Sumter", tax_rate: 0.0080, equalization_rate: 1.00 },
  { state: "FL", county: "Suwannee", tax_rate: 0.0096, equalization_rate: 1.00 },
  { state: "FL", county: "Taylor", tax_rate: 0.0091, equalization_rate: 1.00 },
  { state: "FL", county: "Union", tax_rate: 0.0093, equalization_rate: 1.00 },
  { state: "FL", county: "Volusia", tax_rate: 0.0096, equalization_rate: 1.00 },
  { state: "FL", county: "Wakulla", tax_rate: 0.0093, equalization_rate: 1.00 },
  { state: "FL", county: "Walton", tax_rate: 0.0082, equalization_rate: 1.00 },
  { state: "FL", county: "Washington", tax_rate: 0.0090, equalization_rate: 1.00 },
];

async function main() {
  console.log("Creating county_data table...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS county_data (
      id SERIAL PRIMARY KEY,
      state VARCHAR(2) NOT NULL,
      county VARCHAR(100) NOT NULL,
      tax_rate DOUBLE PRECISION NOT NULL,
      equalization_rate DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      UNIQUE(state, county)
    )
  `);

  console.log("Seeding county data...");
  let count = 0;
  for (const row of COUNTY_DATA) {
    await pool.query(
      `INSERT INTO county_data (state, county, tax_rate, equalization_rate)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (state, county) DO UPDATE
       SET tax_rate = EXCLUDED.tax_rate,
           equalization_rate = EXCLUDED.equalization_rate`,
      [row.state, row.county, row.tax_rate, row.equalization_rate]
    );
    count++;
  }

  console.log(`✓ Seeded ${count} county records`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

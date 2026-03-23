import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/reverse-geocode", async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: "Valid lat and lon query parameters are required." });
    return;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const nominatimRes = await fetch(url, {
      headers: { "User-Agent": "NYPropertyTaxGrievanceApp/1.0 (educational-tool)" },
      signal: AbortSignal.timeout(8000),
    });

    if (!nominatimRes.ok) {
      res.status(502).json({ error: "Geocoding service unavailable." });
      return;
    }

    const data = await nominatimRes.json() as any;
    const addr = data?.address || {};

    if (!addr.state?.toLowerCase().includes("new york")) {
      res.status(400).json({ error: "Location appears to be outside New York State." });
      return;
    }

    // Build a clean street address string
    const houseNumber = addr.house_number || "";
    const road = addr.road || addr.pedestrian || addr.path || "";
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.suburb ||
      addr.city_district ||
      "";
    const state = "NY";
    const postcode = addr.postcode || "";

    const street = [houseNumber, road].filter(Boolean).join(" ");
    const formatted = [street, city, state, postcode].filter(Boolean).join(", ");

    if (!formatted || !street) {
      res.status(404).json({ error: "Could not determine a street address from this location. Try entering your address manually." });
      return;
    }

    res.json({
      formattedAddress: formatted,
      street,
      city,
      state,
      postcode,
      displayName: data.display_name,
    });
  } catch (err) {
    console.error("Reverse geocode error:", err);
    res.status(500).json({ error: "Geocoding service temporarily unavailable." });
  }
});

export default router;

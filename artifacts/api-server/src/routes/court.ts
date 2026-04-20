import { Router } from "express";
import { findCourt } from "../data/court-directory";

const router = Router();

router.get("/court", (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state.toUpperCase() : "";
  const zip = typeof req.query.zip === "string" ? req.query.zip.trim() : "";

  if (!state || !zip) {
    return res.status(400).json({ error: "state and zip are required" });
  }

  const court = findCourt(state, zip);

  if (!court) {
    return res.json({
      fallback: true,
      state,
      zip,
      message: `We couldn't find the exact courthouse for ZIP ${zip}. Search online for "${state} small claims court near ${zip}" or contact your county clerk's office.`,
    });
  }

  res.json(court);
});

export default router;

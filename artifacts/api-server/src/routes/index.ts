import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import grievancesRouter from "./grievances";
import comparablesRouter from "./comparables";
import countiesRouter from "./counties";
import propertyLookupRouter from "./property-lookup";
import reverseGeocodeRouter from "./reverse-geocode";
import ocrTaxRecordRouter from "./ocr-tax-record";
import autoComparablesRouter from "./auto-comparables";
import priorYearRouter from "./prior-year";
import stripeRouter from "./stripe";
import linksRouter from "./links";
import downloadRouter from "./download";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(grievancesRouter);
router.use(comparablesRouter);
router.use(countiesRouter);
router.use(propertyLookupRouter);
router.use(reverseGeocodeRouter);
router.use(ocrTaxRecordRouter);
router.use(autoComparablesRouter);
router.use(priorYearRouter);
router.use(stripeRouter);
router.use("/links", linksRouter);
router.use(downloadRouter);

export default router;

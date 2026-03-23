import { Router, type IRouter } from "express";
import healthRouter from "./health";
import grievancesRouter from "./grievances";
import comparablesRouter from "./comparables";
import countiesRouter from "./counties";
import propertyLookupRouter from "./property-lookup";
import reverseGeocodeRouter from "./reverse-geocode";

const router: IRouter = Router();

router.use(healthRouter);
router.use(grievancesRouter);
router.use(comparablesRouter);
router.use(countiesRouter);
router.use(propertyLookupRouter);
router.use(reverseGeocodeRouter);

export default router;

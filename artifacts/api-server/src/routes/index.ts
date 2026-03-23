import { Router, type IRouter } from "express";
import healthRouter from "./health";
import grievancesRouter from "./grievances";
import comparablesRouter from "./comparables";
import countiesRouter from "./counties";

const router: IRouter = Router();

router.use(healthRouter);
router.use(grievancesRouter);
router.use(comparablesRouter);
router.use(countiesRouter);

export default router;

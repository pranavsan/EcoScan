import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanRouter from "./scan";
import reportsRouter from "./reports";
import analyticsRouter from "./analytics";
import areasRouter from "./areas";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanRouter);
router.use(reportsRouter);
router.use(analyticsRouter);
router.use(areasRouter);

export default router;

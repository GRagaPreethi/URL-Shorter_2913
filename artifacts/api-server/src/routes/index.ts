import { Router, type IRouter } from "express";
import healthRouter from "./health";
import linksRouter from "./links";
import analyticsRouter from "./analytics";
import dashboardRouter from "./dashboard";
import redirectRouter from "./redirect";

const router: IRouter = Router();

router.use(healthRouter);
router.use(linksRouter);
router.use(analyticsRouter);
router.use(dashboardRouter);
router.use(redirectRouter);

export default router;

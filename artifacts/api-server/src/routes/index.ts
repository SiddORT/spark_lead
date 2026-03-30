import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import accessRouter from "./access";
import leadsRouter from "./leads";
import companiesRouter from "./companies";
import servicesRouter from "./services";
import teamRouter from "./team";
import permissionsRouter from "./permissions";
import auditRouter from "./audit";
import analyticsRouter from "./analytics";
import pipelineRouter from "./pipeline";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/access-requests", accessRouter);
router.use("/leads", leadsRouter);
router.use("/companies", companiesRouter);
router.use("/services", servicesRouter);
router.use("/team", teamRouter);
router.use("/permissions", permissionsRouter);
router.use("/audit", auditRouter);
router.use("/analytics", analyticsRouter);
router.use("/pipeline", pipelineRouter);

export default router;

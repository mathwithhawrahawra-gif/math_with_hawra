import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import quizzesRouter from "./quizzes";
import submissionsRouter from "./submissions";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/quizzes", quizzesRouter);
router.use("/submissions", submissionsRouter);
router.use("/dashboard", dashboardRouter);

export default router;

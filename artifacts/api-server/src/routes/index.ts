import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "./auth";
import { dashboardRouter } from "./dashboard";
import { usersRouter } from "./users";
import { transfersRouter } from "./transfers";
import { withdrawalsRouter } from "./withdrawals";
import { tradesRouter } from "./trades";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/users", usersRouter);
router.use("/transfers", transfersRouter);
router.use("/withdrawals", withdrawalsRouter);
router.use("/trades", tradesRouter);

export default router;

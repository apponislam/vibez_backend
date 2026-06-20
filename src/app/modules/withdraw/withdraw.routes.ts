import { Router } from "express";
import { withdrawControllers } from "./withdraw.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// User (Authenticated) Routes
router.post("/connect-account", auth, withdrawControllers.createConnectAccount);
router.post("/request", auth, withdrawControllers.requestWithdrawal);
router.get("/my-withdrawals", auth, withdrawControllers.getUserWithdrawals);

// Admin (Authorized) Routes
router.get("/all", auth, authorize(["ADMIN"]), withdrawControllers.getAllWithdrawals);
router.patch("/:id/approve", auth, authorize(["ADMIN"]), withdrawControllers.approveWithdrawal);
router.patch("/:id/reject", auth, authorize(["ADMIN"]), withdrawControllers.rejectWithdrawal);

export const withdrawRoutes = router;

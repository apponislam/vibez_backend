import { Router } from "express";
import { withdrawControllers } from "./withdraw.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Public redirect routes for Stripe (for mobile deep linking)
router.get("/onboarding-complete", withdrawControllers.onboardingCompleteRedirect);
router.get("/onboarding-refresh", withdrawControllers.onboardingRefreshRedirect);

// User (Authenticated) Routes
router.get("/connect-status", auth, withdrawControllers.getConnectAccountStatus);
router.post("/connect-account", auth, withdrawControllers.createConnectAccount);
router.post("/request", auth, withdrawControllers.requestWithdrawal);
router.get("/my-withdrawals", auth, withdrawControllers.getUserWithdrawals);

// Admin (Authorized) Routes
router.get("/all", auth, authorize(["ADMIN"]), withdrawControllers.getAllWithdrawals);
router.patch("/:id/approve", auth, authorize(["ADMIN"]), withdrawControllers.approveWithdrawal);
router.patch("/:id/reject", auth, authorize(["ADMIN"]), withdrawControllers.rejectWithdrawal);

export const withdrawRoutes = router;

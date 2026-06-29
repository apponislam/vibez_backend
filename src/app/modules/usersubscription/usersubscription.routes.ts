import { Router } from "express";
import { userSubscriptionControllers } from "./usersubscription.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Admin routes
router.get("/admin/all", auth, authorize(["ADMIN"]), userSubscriptionControllers.getAllSubscriptionsByAdmin);
router.get("/admin/revenue-breakdown", auth, authorize(["ADMIN"]), userSubscriptionControllers.getRevenueBreakdown);

// Protected routes (user)
router.post("/checkout", auth, userSubscriptionControllers.createCheckoutSession);
router.post("/", auth, userSubscriptionControllers.createUserSubscription);
router.get("/", auth, userSubscriptionControllers.getUserSubscriptions);
router.get("/:id", auth, userSubscriptionControllers.getUserSubscriptionById);
router.patch("/:id/cancel", auth, userSubscriptionControllers.cancelUserSubscription);
router.patch("/:id/resume", auth, userSubscriptionControllers.resumeUserSubscription);

export const userSubscriptionRoutes = router;

import { Router } from "express";
import { subscriptionControllers } from "./subscription.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Public routes
router.get("/plans", subscriptionControllers.getAllSubscriptionPlans);

// Admin routes
router.get("/admin-stats", auth, authorize(["ADMIN"]), subscriptionControllers.getAdminSubscriptionStats);
router.post("/plans", auth, authorize(["ADMIN"]), subscriptionControllers.createSubscriptionPlan);
router.get("/plans/:id", auth, authorize(["ADMIN"]), subscriptionControllers.getSubscriptionPlanById);
router.patch("/plans/:id", auth, authorize(["ADMIN"]), subscriptionControllers.updateSubscriptionPlan);
router.delete("/plans/:id", auth, authorize(["ADMIN"]), subscriptionControllers.deleteSubscriptionPlan);

export const subscriptionRoutes = router;

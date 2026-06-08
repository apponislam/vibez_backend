import { Router } from "express";
import { subscriptionControllers } from "./subscription.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Public routes
router.get("/plans", subscriptionControllers.getAllSubscriptionPlans);

// Admin routes
router.use(auth, authorize(["ADMIN"]));
router.post("/plans", subscriptionControllers.createSubscriptionPlan);
router.get("/plans/:id", subscriptionControllers.getSubscriptionPlanById);
router.patch("/plans/:id", subscriptionControllers.updateSubscriptionPlan);
router.delete("/plans/:id", subscriptionControllers.deleteSubscriptionPlan);

export const subscriptionRoutes = router;

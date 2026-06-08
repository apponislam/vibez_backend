import { Router } from "express";
import { userSubscriptionControllers } from "./usersubscription.controllers";
import auth from "../../middlewares/auth";

const router = Router();

// Protected routes (user)
router.use(auth);
router.post("/checkout", userSubscriptionControllers.createCheckoutSession);
router.post("/", userSubscriptionControllers.createUserSubscription);
router.get("/", userSubscriptionControllers.getUserSubscriptions);
router.get("/:id", userSubscriptionControllers.getUserSubscriptionById);
router.patch("/:id/cancel", userSubscriptionControllers.cancelUserSubscription);

export const userSubscriptionRoutes = router;

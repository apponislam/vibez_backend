import express from "express";
import { stripeWebhooks } from "./stripe.webhook";

const router = express.Router();

// Stripe webhook route (no auth, raw body needed)
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhooks.handleStripeWebhook
);

export const stripeRoutes = router;

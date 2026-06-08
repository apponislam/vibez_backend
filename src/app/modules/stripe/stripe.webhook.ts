import { Request, Response } from "express";
import { stripeServices } from "./stripe.service";
import config from "../../config";
import catchAsync from "../../../utils/catchAsync";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripe.webhook_secret as string;

    let event;
    try {
        event = stripeServices.stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            console.log("Checkout completed:", session);
            // TODO: Update subscription in database
            break;
        }
        case "invoice.paid": {
            const invoice = event.data.object;
            console.log("Invoice paid:", invoice);
            // TODO: Handle paid invoice
            break;
        }
        case "invoice.payment_failed": {
            const invoice = event.data.object;
            console.log("Invoice payment failed:", invoice);
            // TODO: Handle failed payment
            break;
        }
        default: {
            console.log(`Unhandled event type ${event.type}`);
        }
    }

    res.json({ received: true });
});

export const stripeWebhooks = {
    handleStripeWebhook,
};

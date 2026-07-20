import dotenv from "dotenv";
import path from "path";
import Stripe from "stripe";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
    console.error("STRIPE_SECRET_KEY missing from .env");
    process.exit(1);
}

const stripe = new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia" as any,
});

async function main() {
    try {
        console.log("Creating 1,000 CHF test charge...");
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100000, // 1,000.00 CHF in cents
            currency: "chf",
            payment_method: "pm_card_visa",
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
            },
            description: "Test balance top-up in CHF",
        });

        console.log("SUCCESS! PaymentIntent created:", paymentIntent.id);
        console.log("Amount:", paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
        console.log("Status:", paymentIntent.status);
    } catch (err: any) {
        console.error("Error creating test charge:", err.message || err);
    }
}

main();

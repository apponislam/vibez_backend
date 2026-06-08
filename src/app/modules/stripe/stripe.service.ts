import Stripe from "stripe";
import config from "../../config";

const stripe = new Stripe(config.stripe.secret_key as string, {
    apiVersion: "2026-05-27.dahlia",
});

const createPaymentIntent = async (amount: number, currency: string = "usd") => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ["card"],
    });
    return paymentIntent;
};

const createCheckoutSession = async (priceId: string, successUrl: string, cancelUrl: string, customerEmail?: string, metadata?: Record<string, string>) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata,
    });
    return session;
};

const createProduct = async (name: string) => {
    const product = await stripe.products.create({ name });
    return product;
};

const createPrice = async (productId: string, amount: number, currency: string = "usd", interval: "month" | "year") => {
    const price = await stripe.prices.create({
        product: productId,
        unit_amount: amount,
        currency,
        recurring: { interval },
    });
    return price;
};

const cancelSubscription = async (subscriptionId: string) => {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
    return subscription;
};

const resumeSubscription = async (subscriptionId: string) => {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
    });
    return subscription;
};

export const stripeServices = {
    createPaymentIntent,
    createCheckoutSession,
    createProduct,
    createPrice,
    cancelSubscription,
    resumeSubscription,
    stripe,
};

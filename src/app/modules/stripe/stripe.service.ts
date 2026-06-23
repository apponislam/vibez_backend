import Stripe from "stripe";
import config from "../../config";

const stripe = new Stripe(config.stripe.secret_key as string, {
    apiVersion: "2026-05-27.dahlia",
});

const createPaymentIntent = async (amount: number, currency: string = "chf") => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ["card"],
    });
    return paymentIntent;
};

const createCheckoutSession = async (
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string,
    metadata?: Record<string, string>,
    trialPeriodDays?: number,
    coupon?: string,
    uiMode: "hosted" | "embedded" = "hosted"
) => {
    const isEmbedded = uiMode === "embedded";
    const mappedUiMode = isEmbedded ? "embedded_page" : "hosted_page";
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        ui_mode: mappedUiMode as any,
        ...(isEmbedded ? {
            return_url: successUrl,
        } : {
            success_url: successUrl,
            cancel_url: cancelUrl,
        }),
        customer_email: customerEmail,
        metadata,
        ...(coupon ? {
            discounts: [{ coupon }],
        } : {
            allow_promotion_codes: true,
        }),
        ...(trialPeriodDays && {
            subscription_data: {
                trial_period_days: trialPeriodDays,
            },
        }),
    });
    return session;
};

const createProduct = async (name: string) => {
    const product = await stripe.products.create({ name });
    return product;
};

const createPrice = async (productId: string, amount: number, currency: string = "chf", interval: "month" | "year") => {
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

const createCoupon = async (
    id: string,
    percentOff?: number,
    amountOff?: number,
    currency: string = "chf",
    duration: "once" | "repeating" | "forever" = "forever",
    durationInMonths?: number
) => {
    const coupon = await stripe.coupons.create({
        id,
        ...(percentOff !== undefined && { percent_off: percentOff }),
        ...(amountOff !== undefined && { amount_off: amountOff, currency }),
        duration,
        ...(duration === "repeating" && durationInMonths && { duration_in_months: durationInMonths }),
    });
    return coupon;
};

export const stripeServices = {
    createPaymentIntent,
    createCheckoutSession,
    createProduct,
    createPrice,
    cancelSubscription,
    resumeSubscription,
    createCoupon,
    stripe,
};

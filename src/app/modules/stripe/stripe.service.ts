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

const createPrice = async (productId: string, amount: number, currency: string = "chf", interval: "month" | "year", intervalCount?: number) => {
    const price = await stripe.prices.create({
        product: productId,
        unit_amount: amount,
        currency,
        recurring: { 
            interval,
            ...(intervalCount && { interval_count: intervalCount }),
        },
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

const createSubscriptionPaymentSheet = async (
    priceId: string,
    customerEmail: string,
    metadata?: Record<string, string>,
    trialPeriodDays?: number,
    coupon?: string
) => {
    // 1. Get or create Stripe customer
    let customer;
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    if (customers.data.length > 0) {
        customer = customers.data[0];
    } else {
        customer = await stripe.customers.create({ email: customerEmail, metadata });
    }

    // 2. Create Ephemeral Key (required for saving cards / Stripe SDK mobile)
    const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2026-05-27.dahlia" }
    );

    // 3. Create Stripe Subscription with default_incomplete
    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.confirmation_secret", "pending_setup_intent"],
        metadata,
        ...(coupon && {
            discounts: [{ coupon }],
        }),
        ...(trialPeriodDays && {
            trial_period_days: trialPeriodDays,
        }),
    });

    let clientSecret = "";
    const latestInvoice = subscription.latest_invoice as any;
    if (latestInvoice && latestInvoice.confirmation_secret) {
        clientSecret = latestInvoice.confirmation_secret.client_secret;
    } else if (subscription.pending_setup_intent) {
        clientSecret = (subscription.pending_setup_intent as any).client_secret;
    }

    return {
        subscriptionId: subscription.id,
        clientSecret,
        customerId: customer.id,
        ephemeralKeySecret: ephemeralKey.secret,
    };
};

export const stripeServices = {
    createPaymentIntent,
    createCheckoutSession,
    createSubscriptionPaymentSheet,
    createProduct,
    createPrice,
    cancelSubscription,
    resumeSubscription,
    createCoupon,
    stripe,
};

import { Request, Response } from "express";
import { stripeServices } from "./stripe.service";
import config from "../../config";
import catchAsync from "../../../utils/catchAsync";
import { UserSubscriptionModel } from "../usersubscription/usersubscription.model";
import { SubscriptionPlanModel } from "../subscription/subscription.model";
import { UserSubscriptionStatus } from "../subscription/subscription.interface";
import { UserModel } from "../auth/auth.model";
import { CouponModel } from "../coupon/coupon.model";
import { userSubscriptionServices } from "../usersubscription/usersubscription.services";
import { commissionServices } from "../commission/commission.services";
import { Types } from "mongoose";

const parseStripeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val === "number") {
        return new Date(val * 1000);
    }
    const parsed = new Date(val);
    if (isNaN(parsed.getTime())) {
        return new Date();
    }
    return parsed;
};

const resolveStripePeriodStart = (sub: any): Date => {
    const val = sub.currentPeriodStart || 
                sub.current_period_start ||
                sub.items?.data?.[0]?.currentPeriodStart ||
                sub.items?.data?.[0]?.current_period_start ||
                sub.trialStart ||
                sub.trial_start ||
                sub.startDate ||
                sub.start_date;
    return parseStripeDate(val);
};

const resolveStripePeriodEnd = (sub: any): Date => {
    const val = sub.currentPeriodEnd || 
                sub.current_period_end ||
                sub.items?.data?.[0]?.currentPeriodEnd ||
                sub.items?.data?.[0]?.current_period_end ||
                sub.trialEnd ||
                sub.trial_end ||
                sub.billingCycleAnchor ||
                sub.billing_cycle_anchor;
    return parseStripeDate(val);
};

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripe.webhook_secret as string;

    let event;
    try {
        event = stripeServices.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        console.log(`[Webhook] Event received: ${event.type}`);
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                console.log("Checkout completed:", session);

                const subscriptionId = (session as any).subscription;
                if (!subscriptionId) {
                    break;
                }

                // Check if userSubscription already exists
                let userSubscription = await UserSubscriptionModel.findOne({
                    stripeSubscriptionId: subscriptionId,
                });

                if (userSubscription) {
                    console.log("Subscription already created:", subscriptionId);
                    break;
                }

                // Retrieve subscription from Stripe to get price and metadata
                const stripeSub = await stripeServices.stripe.subscriptions.retrieve(subscriptionId);
                const stripePriceId = stripeSub.items.data[0].price.id;

                const subscriptionPlan = await SubscriptionPlanModel.findOne({
                    stripePriceId: stripePriceId,
                });

                const userId = (session as any).metadata?.userId || stripeSub.metadata?.userId;
                console.log(`[Webhook] checkout.session.completed: stripePriceId=${stripePriceId}, planFound=${!!subscriptionPlan}, userId=${userId}`);

                const coupon = (session as any).metadata?.coupon || stripeSub.metadata?.coupon;
                const referralCode = (session as any).metadata?.referralCode || stripeSub.metadata?.referralCode;

                if (subscriptionPlan && userId) {
                    const startDate = resolveStripePeriodStart(stripeSub);
                    const endDate = resolveStripePeriodEnd(stripeSub);

                    // Resolve referrer from metadata if provided
                    let referredBy = undefined;
                    if (referralCode) {
                        const referrer = await UserModel.findOne({ referralCode });
                        if (referrer && referrer._id.toString() !== userId.toString()) {
                            referredBy = referrer._id;
                        }
                    }

                    // Cancel any previous active subscriptions first
                    await userSubscriptionServices.cancelPreviousActiveSubscriptions(userId, subscriptionId);

                    const actualPrice = subscriptionPlan.price;
                    const paidPrice = (session as any).amount_total !== undefined && (session as any).amount_total !== null
                        ? (session as any).amount_total / 100
                        : subscriptionPlan.price;

                    // Calculate commissionAmount if referred
                    let commissionAmount = undefined;
                    if (referredBy) {
                        const referrer = await UserModel.findById(referredBy);
                        if (referrer) {
                            const commissionPercentage = referrer.commissionPercentage || 0;
                            const calculatedCommission = paidPrice * (commissionPercentage / 100);
                            commissionAmount = Number(Math.min(calculatedCommission, referrer.maxPayout || 0).toFixed(2));
                        }
                    }

                    let percentOff = undefined;
                    let amountOff = undefined;
                    if (coupon) {
                        const dbCoupon = await CouponModel.findOne({ couponId: coupon });
                        if (dbCoupon) {
                            percentOff = dbCoupon.percentOff;
                            amountOff = dbCoupon.amountOff;
                        }
                    }

                    // Create user subscription
                    const userSub = await UserSubscriptionModel.create({
                        userId,
                        subscriptionPlanId: subscriptionPlan._id,
                        stripeSubscriptionId: subscriptionId,
                        stripeCustomerId: (session as any).customer,
                        status: UserSubscriptionStatus.ACTIVE,
                        startDate,
                        endDate,
                        isTrial: stripeSub.status === "trialing",
                        percentOff,
                        amountOff,
                        actualPrice,
                        paidPrice,
                        commissionUser: referredBy || undefined,
                        commissionAmount,
                    });

                    if (referredBy && commissionAmount !== undefined) {
                        const invoiceId = (session as any).invoice || (session as any).id;
                        await commissionServices.handleSubscriptionPayment({
                            userId,
                            referredBy: referredBy.toString(),
                            invoiceId,
                            subscriptionId,
                            invoiceAmount: paidPrice,
                            userSubscriptionId: userSub._id.toString(),
                        });
                    }

                    // Update User model with subscription info
                    await UserModel.findByIdAndUpdate(userId, {
                        $set: {
                            subscriptionPlanId: subscriptionPlan._id,
                            subscriptionEndDate: endDate,
                            isNewUser: false,
                            ...(referredBy && { referredBy }),
                        },
                    });

                    // Increment coupon redemption counter if a coupon was used
                    if (coupon) {
                        await CouponModel.findOneAndUpdate({ couponId: coupon }, { $inc: { timesRedeemed: 1 } });
                    }
                }
                break;
            }
            case "invoice.paid": {
                const invoice = event.data.object;
                console.log("Invoice paid:", invoice);
                const subscriptionId = (invoice as any).subscription || (invoice as any).parent?.subscription_details?.subscription || (invoice as any).lines?.data?.[0]?.parent?.subscription_item_details?.subscription;

                if (subscriptionId) {
                    const stripeSub = await stripeServices.stripe.subscriptions.retrieve(subscriptionId);
                    let userSubscription = await UserSubscriptionModel.findOne({
                        stripeSubscriptionId: subscriptionId,
                    });

                    if (!userSubscription) {
                        // Retrieve subscription from Stripe to get metadata
                        const userId = stripeSub.metadata?.userId;
                        const coupon = stripeSub.metadata?.coupon;
                        const referralCode = stripeSub.metadata?.referralCode;

                        if (userId) {
                            const stripePriceId = stripeSub.items.data[0].price.id;
                            const subscriptionPlan = await SubscriptionPlanModel.findOne({
                                stripePriceId: stripePriceId,
                            });
                            console.log(`[Webhook] invoice.paid: stripePriceId=${stripePriceId}, planFound=${!!subscriptionPlan}, userId=${userId}`);

                            if (subscriptionPlan) {
                                const startDate = resolveStripePeriodStart(stripeSub);
                                const endDate = resolveStripePeriodEnd(stripeSub);

                                let referredBy = undefined;
                                if (referralCode) {
                                    const referrer = await UserModel.findOne({ referralCode });
                                    if (referrer && referrer._id.toString() !== userId) {
                                        referredBy = referrer._id;
                                    }
                                }

                                // Cancel any previous active subscriptions first
                                await userSubscriptionServices.cancelPreviousActiveSubscriptions(userId, subscriptionId);

                                const actualPrice = subscriptionPlan.price;
                                const paidPrice = (invoice as any).amount_paid !== undefined && (invoice as any).amount_paid !== null
                                    ? (invoice as any).amount_paid / 100
                                    : subscriptionPlan.price;

                                // Calculate commissionAmount if referred
                                let commissionAmount = undefined;
                                if (referredBy) {
                                    const referrer = await UserModel.findById(referredBy);
                                    if (referrer) {
                                        const commissionPercentage = referrer.commissionPercentage || 0;
                                        const calculatedCommission = paidPrice * (commissionPercentage / 100);
                                        commissionAmount = Number(Math.min(calculatedCommission, referrer.maxPayout || 0).toFixed(2));
                                    }
                                }

                                let percentOff = undefined;
                                let amountOff = undefined;
                                if (coupon) {
                                    const dbCoupon = await CouponModel.findOne({ couponId: coupon });
                                    if (dbCoupon) {
                                        percentOff = dbCoupon.percentOff;
                                        amountOff = dbCoupon.amountOff;
                                    }
                                }

                                userSubscription = await UserSubscriptionModel.create({
                                    userId,
                                    subscriptionPlanId: subscriptionPlan._id,
                                    stripeSubscriptionId: subscriptionId,
                                    stripeCustomerId: stripeSub.customer as string,
                                    status: UserSubscriptionStatus.ACTIVE,
                                    startDate,
                                    endDate,
                                    isTrial: stripeSub.status === "trialing",
                                    percentOff,
                                    amountOff,
                                    actualPrice,
                                    paidPrice,
                                    commissionUser: referredBy || undefined,
                                    commissionAmount,
                                });

                                if (referredBy && commissionAmount !== undefined) {
                                    const invoiceId = (invoice as any).id;
                                    await commissionServices.handleSubscriptionPayment({
                                        userId,
                                        referredBy: referredBy.toString(),
                                        invoiceId,
                                        subscriptionId,
                                        invoiceAmount: paidPrice,
                                        userSubscriptionId: userSubscription._id.toString(),
                                    });
                                }

                                const updatedUser = await UserModel.findByIdAndUpdate(userId, {
                                    $set: {
                                        subscriptionPlanId: subscriptionPlan._id,
                                        subscriptionEndDate: endDate,
                                        isNewUser: false,
                                        ...(referredBy && { referredBy }),
                                    },
                                });

                                if (coupon) {
                                    await CouponModel.findOneAndUpdate({ couponId: coupon }, { $inc: { timesRedeemed: 1 } });
                                }
                            }
                        }
                    } else {
                        // Extend end date
                        let newEndDate = resolveStripePeriodEnd(stripeSub);
                        // Get plan to know duration
                        const plan = await SubscriptionPlanModel.findById(userSubscription.subscriptionPlanId);
                        if (plan) {
                            const actualPrice = plan.price;
                            const paidPrice = (invoice as any).amount_paid !== undefined && (invoice as any).amount_paid !== null
                                ? (invoice as any).amount_paid / 100
                                : plan.price;

                            await UserSubscriptionModel.findByIdAndUpdate(userSubscription._id, {
                                $set: {
                                    endDate: newEndDate,
                                    status: UserSubscriptionStatus.ACTIVE,
                                    actualPrice,
                                    paidPrice,
                                    isTrial: false,
                                },
                            });
                            // Update User model as well
                            await UserModel.findByIdAndUpdate(userSubscription.userId, {
                                $set: {
                                    subscriptionEndDate: newEndDate,
                                },
                            });

                            // Process renewal commission if referred
                            if (userSubscription.commissionUser) {
                                const invoiceId = (invoice as any).id;
                                await commissionServices.handleSubscriptionPayment({
                                    userId: userSubscription.userId.toString(),
                                    referredBy: userSubscription.commissionUser.toString(),
                                    invoiceId,
                                    subscriptionId,
                                    invoiceAmount: paidPrice,
                                    userSubscriptionId: userSubscription._id.toString(),
                                });
                            }
                        }
                    }
                }
                break;
            }
            case "invoice.payment_failed": {
                const invoice = event.data.object;
                console.log("Invoice payment failed:", invoice);

                const subscriptionId = (invoice as any).subscription || (invoice as any).parent?.subscription_details?.subscription || (invoice as any).lines?.data?.[0]?.parent?.subscription_item_details?.subscription;

                // Update user subscription status
                const userSubscription = await UserSubscriptionModel.findOne({
                    stripeSubscriptionId: subscriptionId,
                });
                if (userSubscription) {
                    await UserSubscriptionModel.findByIdAndUpdate(userSubscription._id, {
                        $set: { status: UserSubscriptionStatus.CANCELLED },
                    });
                }
                break;
            }
            case "customer.subscription.updated": {
                const subscription = event.data.object;
                // console.log("Subscription updated:", subscription);

                // Update user subscription
                const stripeSubscriptionId = (subscription as any).id;
                let userSubscription = await UserSubscriptionModel.findOne({
                    stripeSubscriptionId,
                });
                if (userSubscription) {
                    let newStatus = UserSubscriptionStatus.ACTIVE;
                    if ((subscription as any).cancel_at_period_end || (subscription as any).canceled_at) {
                        newStatus = UserSubscriptionStatus.CANCELLED;
                    } else if ((subscription as any).status === "past_due" || (subscription as any).status === "unpaid") {
                        newStatus = UserSubscriptionStatus.CANCELLED;
                    }

                    await UserSubscriptionModel.findByIdAndUpdate(userSubscription._id, { $set: { status: newStatus } });
                } else {
                    console.log(`[Webhook] customer.subscription.updated: Subscription ${stripeSubscriptionId} not in DB. Status=${(subscription as any).status}`);
                    // Try to create the subscription if it does not exist yet (e.g. for free trials / setup payment sheets)
                    const status = (subscription as any).status;
                    if (status === "active" || status === "trialing") {
                        const userId = (subscription as any).metadata?.userId;
                        console.log(`[Webhook] customer.subscription.updated: userId=${userId}`);
                        if (userId) {
                            const stripePriceId = (subscription as any).items?.data?.[0]?.price?.id;
                            console.log(`[Webhook] customer.subscription.updated: stripePriceId=${stripePriceId}`);
                            if (stripePriceId) {
                                const subscriptionPlan = await SubscriptionPlanModel.findOne({ stripePriceId });
                                console.log(`[Webhook] customer.subscription.updated: planFound=${!!subscriptionPlan}`);
                                if (subscriptionPlan) {
                                     const startDate = resolveStripePeriodStart(subscription);
                                     const endDate = resolveStripePeriodEnd(subscription);

                                    const referralCode = (subscription as any).metadata?.referralCode;
                                    const coupon = (subscription as any).metadata?.coupon;

                                    let referredBy = undefined;
                                    if (referralCode) {
                                        const referrer = await UserModel.findOne({ referralCode });
                                        if (referrer && referrer._id.toString() !== userId) {
                                            referredBy = referrer._id;
                                        }
                                    }

                                    // Cancel any previous active subscriptions first
                                    await userSubscriptionServices.cancelPreviousActiveSubscriptions(userId, stripeSubscriptionId);

                                    const actualPrice = subscriptionPlan.price;
                                    // For a free trial or setup, paid price is 0 if status is trialing
                                    const paidPrice = status === "trialing" ? 0 : subscriptionPlan.price;

                                    // Calculate commissionAmount if referred
                                    let commissionAmount = undefined;
                                    if (referredBy) {
                                        const referrer = await UserModel.findById(referredBy);
                                        if (referrer) {
                                            const commissionPercentage = referrer.commissionPercentage || 0;
                                            const calculatedCommission = paidPrice * (commissionPercentage / 100);
                                            commissionAmount = Number(Math.min(calculatedCommission, referrer.maxPayout || 0).toFixed(2));
                                        }
                                    }

                                    let percentOff = undefined;
                                    let amountOff = undefined;
                                    if (coupon) {
                                        const dbCoupon = await CouponModel.findOne({ couponId: coupon });
                                        if (dbCoupon) {
                                            percentOff = dbCoupon.percentOff;
                                            amountOff = dbCoupon.amountOff;
                                        }
                                    }

                                    userSubscription = await UserSubscriptionModel.create({
                                        userId,
                                        subscriptionPlanId: subscriptionPlan._id,
                                        stripeSubscriptionId,
                                        stripeCustomerId: (subscription as any).customer as string,
                                        status: UserSubscriptionStatus.ACTIVE,
                                        startDate,
                                        endDate,
                                        isTrial: status === "trialing",
                                        percentOff,
                                        amountOff,
                                        actualPrice,
                                        paidPrice,
                                        commissionUser: referredBy || undefined,
                                        commissionAmount,
                                    });

                                    if (referredBy && commissionAmount !== undefined && commissionAmount > 0) {
                                        const invoiceId = (subscription as any).latest_invoice as string || "trial";
                                        await commissionServices.handleSubscriptionPayment({
                                            userId,
                                            referredBy: referredBy.toString(),
                                            invoiceId,
                                            subscriptionId: stripeSubscriptionId,
                                            invoiceAmount: paidPrice,
                                            userSubscriptionId: userSubscription._id.toString(),
                                        });
                                    }

                                    await UserModel.findByIdAndUpdate(userId, {
                                        $set: {
                                            subscriptionPlanId: subscriptionPlan._id,
                                            subscriptionEndDate: endDate,
                                            isNewUser: false,
                                            ...(referredBy && { referredBy }),
                                        },
                                    });

                                    if (coupon) {
                                        await CouponModel.findOneAndUpdate({ couponId: coupon }, { $inc: { timesRedeemed: 1 } });
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                console.log("Subscription deleted/cancelled:", subscription);

                // Find user subscription
                const userSubscription = await UserSubscriptionModel.findOne({
                    stripeSubscriptionId: (subscription as any).id,
                });
                if (userSubscription) {
                    await UserSubscriptionModel.findByIdAndUpdate(userSubscription._id, {
                        $set: { status: UserSubscriptionStatus.CANCELLED },
                    });

                    // Clear user's subscription info if this was their active subscription
                    const user = await UserModel.findById(userSubscription.userId);
                    if (user && user.subscriptionPlanId?.toString() === userSubscription.subscriptionPlanId.toString()) {
                        await UserModel.findByIdAndUpdate(userSubscription.userId, {
                            $set: {
                                subscriptionPlanId: null,
                                subscriptionEndDate: null,
                            },
                        });
                    }
                }
                break;
            }
            default: {
                console.log(`Unhandled event type ${event.type}`);
            }
        }
    } catch (err: any) {
        console.error("[Webhook Error] Error executing webhook handler:", err);
        throw err;
    }

    res.json({ received: true });
});

export const stripeWebhooks = {
    handleStripeWebhook,
};

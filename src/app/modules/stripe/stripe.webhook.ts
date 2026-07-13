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

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripe.webhook_secret as string;

    let event;
    try {
        event = stripeServices.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                console.log("Checkout completed:", session);

                // Find subscription plan by stripe price id
                const subscriptionPlan = await SubscriptionPlanModel.findOne({
                    stripePriceId: (session as any).line_items?.data[0].price.id,
                });
                const userId = (session as any).metadata?.userId;
                const coupon = (session as any).metadata?.coupon;
                const referralCode = (session as any).metadata?.referralCode;
                if (subscriptionPlan && userId) {
                    // Calculate end date based on plan duration
                    const startDate = new Date();
                    let endDate = new Date(startDate);
                    if (subscriptionPlan.duration === "MONTHLY") {
                        endDate.setMonth(endDate.getMonth() + 1);
                    } else if (subscriptionPlan.duration === "HALF_YEARLY") {
                        endDate.setMonth(endDate.getMonth() + 6);
                    } else if (subscriptionPlan.duration === "YEARLY") {
                        endDate.setFullYear(endDate.getFullYear() + 1);
                    }

                    // Resolve referrer from metadata if provided
                    let referredBy = undefined;
                    if (referralCode) {
                        const referrer = await UserModel.findOne({ referralCode });
                        if (referrer && referrer._id.toString() !== userId) {
                            referredBy = referrer._id;
                        }
                    }

                    // Cancel any previous active subscriptions first
                    await userSubscriptionServices.cancelPreviousActiveSubscriptions(userId, (session as any).subscription);

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
                            commissionAmount = Number((paidPrice * (commissionPercentage / 100)).toFixed(2));
                        }
                    }

                    // Create user subscription
                    await UserSubscriptionModel.create({
                        userId,
                        subscriptionPlanId: subscriptionPlan._id,
                        stripeSubscriptionId: (session as any).subscription,
                        stripeCustomerId: (session as any).customer,
                        status: UserSubscriptionStatus.ACTIVE,
                        startDate,
                        endDate,
                        isTrial: false,
                        coupon: coupon || undefined,
                        actualPrice,
                        paidPrice,
                        commissionUser: referredBy || undefined,
                        commissionAmount,
                    });

                    // Update User model with subscription info
                    await UserModel.findByIdAndUpdate(userId, {
                        $set: {
                            subscriptionPlanId: subscriptionPlan._id,
                            subscriptionEndDate: endDate,
                            isNewUser: false,
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
                    let userSubscription = await UserSubscriptionModel.findOne({
                        stripeSubscriptionId: subscriptionId,
                    });

                    if (!userSubscription) {
                        // Retrieve subscription from Stripe to get metadata
                        const stripeSub = await stripeServices.stripe.subscriptions.retrieve(subscriptionId);
                        const userId = stripeSub.metadata?.userId;
                        const coupon = stripeSub.metadata?.coupon;
                        const referralCode = stripeSub.metadata?.referralCode;

                        if (userId) {
                            const stripePriceId = stripeSub.items.data[0].price.id;
                            const subscriptionPlan = await SubscriptionPlanModel.findOne({
                                stripePriceId: stripePriceId,
                            });

                            if (subscriptionPlan) {
                                const startDate = new Date();
                                let endDate = new Date(startDate);
                                if (subscriptionPlan.duration === "MONTHLY") {
                                    endDate.setMonth(endDate.getMonth() + 1);
                                } else if (subscriptionPlan.duration === "HALF_YEARLY") {
                                    endDate.setMonth(endDate.getMonth() + 6);
                                } else if (subscriptionPlan.duration === "YEARLY") {
                                    endDate.setFullYear(endDate.getFullYear() + 1);
                                }

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
                                        commissionAmount = Number((paidPrice * (commissionPercentage / 100)).toFixed(2));
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
                                    isTrial: false,
                                    coupon: coupon || undefined,
                                    actualPrice,
                                    paidPrice,
                                    commissionUser: referredBy || undefined,
                                    commissionAmount,
                                });

                                const updatedUser = await UserModel.findByIdAndUpdate(userId, {
                                    $set: {
                                        subscriptionPlanId: subscriptionPlan._id,
                                        subscriptionEndDate: endDate,
                                        isNewUser: false,
                                    },
                                });

                                if (coupon) {
                                    await CouponModel.findOneAndUpdate({ couponId: coupon }, { $inc: { timesRedeemed: 1 } });
                                }
                            }
                        }
                    } else {
                        // Extend end date
                        let newEndDate = new Date(userSubscription.endDate);
                        // Get plan to know duration
                        const plan = await SubscriptionPlanModel.findById(userSubscription.subscriptionPlanId);
                        if (plan) {
                            if (plan.duration === "MONTHLY") {
                                newEndDate.setMonth(newEndDate.getMonth() + 1);
                            } else if (plan.duration === "HALF_YEARLY") {
                                newEndDate.setMonth(newEndDate.getMonth() + 6);
                            } else if (plan.duration === "YEARLY") {
                                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                            }
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
                                },
                            });
                            // Update User model as well
                            await UserModel.findByIdAndUpdate(userSubscription.userId, {
                                $set: {
                                    subscriptionEndDate: newEndDate,
                                },
                            });
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
                const userSubscription = await UserSubscriptionModel.findOne({
                    stripeSubscriptionId: (subscription as any).id,
                });
                if (userSubscription) {
                    let newStatus = UserSubscriptionStatus.ACTIVE;
                    if ((subscription as any).cancel_at_period_end || (subscription as any).canceled_at) {
                        newStatus = UserSubscriptionStatus.CANCELLED;
                    } else if ((subscription as any).status === "past_due" || (subscription as any).status === "unpaid") {
                        newStatus = UserSubscriptionStatus.CANCELLED;
                    }

                    await UserSubscriptionModel.findByIdAndUpdate(userSubscription._id, { $set: { status: newStatus } });
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
        throw err;
    }

    res.json({ received: true });
});

export const stripeWebhooks = {
    handleStripeWebhook,
};

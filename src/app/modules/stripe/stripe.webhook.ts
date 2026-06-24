import { Request, Response } from "express";
import { stripeServices } from "./stripe.service";
import config from "../../config";
import catchAsync from "../../../utils/catchAsync";
import { UserSubscriptionModel } from "../usersubscription/usersubscription.model";
import { SubscriptionPlanModel } from "../subscription/subscription.model";
import { UserSubscriptionStatus } from "../subscription/subscription.interface";
import { UserModel } from "../auth/auth.model";
import { CouponModel } from "../coupon/coupon.model";
import fs from "fs";
import path from "path";

const logDebug = (msg: string, data?: any) => {
    try {
        const logFilePath = path.join(process.cwd(), "webhook_debug.log");
        const timestamp = new Date().toISOString();
        const formattedData = data ? ` | Data: ${JSON.stringify(data)}` : "";
        const logLine = `[${timestamp}] ${msg}${formattedData}\n`;
        fs.appendFileSync(logFilePath, logLine);
    } catch (err) {
        console.error("Failed to write to debug log:", err);
    }
};

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = config.stripe.webhook_secret as string;

    let event;
    try {
        event = stripeServices.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        logDebug("Webhook construction error", { message: err.message });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logDebug("Webhook event received", { type: event.type, id: event.id });

    try {
        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                console.log("Checkout completed:", session);
                logDebug("Checkout session completed event entered", { sessionId: session.id });

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
                        commissionUser: referredBy || undefined,
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
                logDebug("invoice.paid case entered", { invoiceId: invoice.id, subscriptionId });

                if (subscriptionId) {
                    let userSubscription = await UserSubscriptionModel.findOne({
                        stripeSubscriptionId: subscriptionId,
                    });
                    logDebug("Found userSubscription in DB", { found: !!userSubscription });

                    if (!userSubscription) {
                        // Retrieve subscription from Stripe to get metadata
                        const stripeSub = await stripeServices.stripe.subscriptions.retrieve(subscriptionId);
                        const userId = stripeSub.metadata?.userId;
                        const coupon = stripeSub.metadata?.coupon;
                        const referralCode = stripeSub.metadata?.referralCode;
                        logDebug("Retrieved stripeSub details", { stripeSubId: stripeSub.id, userId, coupon });

                        if (userId) {
                            const stripePriceId = stripeSub.items.data[0].price.id;
                            const subscriptionPlan = await SubscriptionPlanModel.findOne({
                                stripePriceId: stripePriceId,
                            });
                            logDebug("Found subscriptionPlan in DB", { found: !!subscriptionPlan, stripePriceId });

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

                                logDebug("Creating UserSubscription record in DB...");
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
                                    commissionUser: referredBy || undefined,
                                });
                                logDebug("UserSubscription created successfully", { docId: userSubscription._id });

                                logDebug("Updating UserModel in DB...", { userId });
                                const updatedUser = await UserModel.findByIdAndUpdate(userId, {
                                    $set: {
                                        subscriptionPlanId: subscriptionPlan._id,
                                        subscriptionEndDate: endDate,
                                        isNewUser: false,
                                    },
                                });
                                logDebug("UserModel updated successfully", { userFound: !!updatedUser });

                                if (coupon) {
                                    await CouponModel.findOneAndUpdate({ couponId: coupon }, { $inc: { timesRedeemed: 1 } });
                                }
                            }
                        } else {
                            logDebug("Skipped subscription creation: No userId in stripeSub metadata");
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
                            await UserSubscriptionModel.findByIdAndUpdate(userSubscription._id, {
                                $set: {
                                    endDate: newEndDate,
                                    status: UserSubscriptionStatus.ACTIVE,
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
                console.log("Subscription updated:", subscription);

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
            default: {
                console.log(`Unhandled event type ${event.type}`);
            }
        }
    } catch (err: any) {
        logDebug("ERROR inside webhook handler", { message: err.message, stack: err.stack });
        throw err;
    }

    res.json({ received: true });
});

export const stripeWebhooks = {
    handleStripeWebhook,
};

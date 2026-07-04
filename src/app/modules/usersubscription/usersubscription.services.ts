import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserSubscriptionModel } from "./usersubscription.model";
import { IUserSubscription } from "./usersubscription.interface";
import { SubscriptionPlanModel } from "../subscription/subscription.model";
import { SubscriptionDuration, UserSubscriptionStatus } from "../subscription/subscription.interface";
import { stripeServices } from "../stripe/stripe.service";
import { UserModel } from "../auth/auth.model";
import { commissionServices } from "../commission/commission.services";
import { Types } from "mongoose";

const populateOptions = ["subscriptionPlanId", { path: "commissionUser", select: "name email" }];

const cancelPreviousActiveSubscriptions = async (userId: string, newStripeSubscriptionId?: string) => {
    const activeSubscriptions = await UserSubscriptionModel.find({
        userId,
        status: UserSubscriptionStatus.ACTIVE,
    });

    for (const sub of activeSubscriptions) {
        if (newStripeSubscriptionId && sub.stripeSubscriptionId === newStripeSubscriptionId) {
            continue;
        }

        if (sub.stripeSubscriptionId) {
            try {
                await stripeServices.stripe.subscriptions.cancel(sub.stripeSubscriptionId);
            } catch (error) {
                console.error(`Failed to cancel Stripe subscription ${sub.stripeSubscriptionId}:`, error);
            }
        }

        await UserSubscriptionModel.findByIdAndUpdate(sub._id, {
            $set: { status: UserSubscriptionStatus.CANCELLED },
        });
    }
};

const createUserSubscription = async (data: Partial<IUserSubscription>, userId: string) => {
    const plan = await SubscriptionPlanModel.findById(data.subscriptionPlanId);
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");

    // Cancel any previous active subscriptions
    await cancelPreviousActiveSubscriptions(userId, data.stripeSubscriptionId);

    let endDate;
    const startDate = new Date();

    if (plan.duration === SubscriptionDuration.MONTHLY) {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.duration === SubscriptionDuration.HALF_YEARLY) {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
    } else if (plan.duration === SubscriptionDuration.YEARLY) {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid subscription duration");
    }

    const subscriptionData = data as any;
    if (subscriptionData.referralCode) {
        const referrer = await UserModel.findOne({ referralCode: subscriptionData.referralCode });
        if (referrer && referrer._id.toString() !== userId) {
            subscriptionData.commissionUser = referrer._id;
        }
        delete subscriptionData.referralCode;
    }

    // Calculate commissionAmount if referred
    let commissionAmount = undefined;
    if (subscriptionData.commissionUser) {
        const referrer = await UserModel.findById(subscriptionData.commissionUser);
        if (referrer) {
            const commissionPercentage = referrer.commissionPercentage || 0;
            commissionAmount = Number((plan.price * (commissionPercentage / 100)).toFixed(2));
        }
    }

    const userSubscription = await UserSubscriptionModel.create({
        ...subscriptionData,
        userId,
        startDate,
        endDate,
        commissionAmount,
    });

    await userSubscription.populate(populateOptions);
    // Update User model with subscription info
    await UserModel.findByIdAndUpdate(userId, {
        $set: {
            subscriptionPlanId: plan._id,
            subscriptionEndDate: endDate,
            isNewUser: false,
        },
    });
    return userSubscription;
};

const getUserSubscriptions = async (userId: string) => {
    const subscriptions = await UserSubscriptionModel.find({ userId }).populate(populateOptions);
    return subscriptions;
};

const getUserSubscriptionById = async (id: string, userId: string) => {
    const subscription = await UserSubscriptionModel.findOne({
        _id: id,
        userId,
    }).populate(populateOptions);
    if (!subscription) throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
    return subscription;
};

const cancelUserSubscription = async (id: string, userId: string) => {
    const subscription = await UserSubscriptionModel.findOne({ _id: id, userId });
    if (!subscription) throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");

    // Cancel auto-renew on Stripe
    if (subscription.stripeSubscriptionId) {
        await stripeServices.cancelSubscription(subscription.stripeSubscriptionId);
    }

    // Update in DB
    const updatedSubscription = await UserSubscriptionModel.findOneAndUpdate({ _id: id, userId }, { $set: { status: "CANCELLED" } }, { returnDocument: 'after' }).populate(populateOptions);

    // Clear user's subscription info if needed
    await UserModel.findByIdAndUpdate(userId, {
        $set: {
            subscriptionPlanId: null,
            subscriptionEndDate: null,
        },
    });

    return updatedSubscription;
};

const resumeUserSubscription = async (id: string, userId: string) => {
    const subscription = await UserSubscriptionModel.findOne({ _id: id, userId });
    if (!subscription) throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");

    // Resume auto-renew on Stripe
    if (subscription.stripeSubscriptionId) {
        await stripeServices.resumeSubscription(subscription.stripeSubscriptionId);
    }

    // Update in DB
    const updatedSubscription = await UserSubscriptionModel.findOneAndUpdate({ _id: id, userId }, { $set: { status: "ACTIVE" } }, { returnDocument: 'after' }).populate(populateOptions);
    return updatedSubscription;
};

const getAllSubscriptionsByAdmin = async (query: any) => {
    const { page = 1, limit = 10, search, status } = query;
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const filters: any = {};

    if (status) {
        filters.status = status;
    }

    if (search) {
        const users = await UserModel.find({
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        }).select("_id");
        const userIds = users.map((u) => u._id);
        filters.userId = { $in: userIds };
    }

    const [subscriptions, total] = await Promise.all([
        UserSubscriptionModel.find(filters)
            .populate({
                path: "userId",
                select: "name email profileImage",
            })
            .populate({
                path: "subscriptionPlanId",
                select: "name price duration isFreeTrial",
            })
            .populate({
                path: "commissionUser",
                select: "name email",
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean(),
        UserSubscriptionModel.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);
    const hasNext = parsedPage < totalPages;
    const hasPrev = parsedPage > 1;

    return {
        data: subscriptions,
        meta: {
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

const getRevenueBreakdown = async () => {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const subscriptions = await UserSubscriptionModel.find({
        createdAt: { $gte: startDate, $lte: endDate },
    })
    .populate("subscriptionPlanId")
    .lean();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const breakdown = monthNames.map((month) => ({
        month,
        revenue: 0,
        referrals: 0,
    }));

    for (const sub of subscriptions) {
        const date = new Date((sub as any).createdAt);
        const monthIndex = date.getMonth();

        if (sub.commissionUser) {
            breakdown[monthIndex].referrals++;
        }

        if (!sub.isTrial && sub.subscriptionPlanId) {
            const plan = sub.subscriptionPlanId as any;
            if (plan && typeof plan.price === "number") {
                breakdown[monthIndex].revenue += plan.price;
            }
        }
    }

    for (const entry of breakdown) {
        entry.revenue = Number(entry.revenue.toFixed(2));
    }

    return breakdown;
};

const getMonthlyCommissionGraph = async () => {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const subscriptions = await UserSubscriptionModel.find({
        commissionUser: { $ne: null },
        commissionAmount: { $gt: 0 },
        createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const breakdown = monthNames.map((month) => ({
        month,
        commissionRevenue: 0,
    }));

    for (const sub of subscriptions) {
        const subData = sub as any;
        if (subData.createdAt) {
            const date = new Date(subData.createdAt);
            const monthIndex = date.getMonth();
            breakdown[monthIndex].commissionRevenue += subData.commissionAmount || 0;
        }
    }

    for (const entry of breakdown) {
        entry.commissionRevenue = Number(entry.commissionRevenue.toFixed(2));
    }

    return breakdown;
};

export const userSubscriptionServices = {
    createUserSubscription,
    getUserSubscriptions,
    getUserSubscriptionById,
    cancelUserSubscription,
    resumeUserSubscription,
    cancelPreviousActiveSubscriptions,
    getAllSubscriptionsByAdmin,
    getRevenueBreakdown,
    getMonthlyCommissionGraph,
};

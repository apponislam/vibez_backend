import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserSubscriptionModel } from "./usersubscription.model";
import { IUserSubscription } from "./usersubscription.interface";
import { SubscriptionPlanModel } from "../subscription/subscription.model";
import { SubscriptionDuration } from "../subscription/subscription.interface";
import { stripeServices } from "../stripe/stripe.service";
import { UserModel } from "../auth/auth.model";

const populateOptions = ["subscriptionPlanId", { path: "commissionUser", select: "name email" }];

const createUserSubscription = async (data: Partial<IUserSubscription>, userId: string) => {
    const plan = await SubscriptionPlanModel.findById(data.subscriptionPlanId);
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");

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

    const userSubscription = await UserSubscriptionModel.create({
        ...data,
        userId,
        startDate,
        endDate,
    });
    await userSubscription.populate(populateOptions);
    // Update User model with subscription info
    await UserModel.findByIdAndUpdate(userId, {
        $set: {
            subscriptionPlanId: plan._id,
            subscriptionEndDate: endDate,
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
    const updatedSubscription = await UserSubscriptionModel.findOneAndUpdate({ _id: id, userId }, { $set: { status: "CANCELLED" } }, { new: true }).populate(populateOptions);

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
    const updatedSubscription = await UserSubscriptionModel.findOneAndUpdate({ _id: id, userId }, { $set: { status: "ACTIVE" } }, { new: true }).populate(populateOptions);
    return updatedSubscription;
};

export const userSubscriptionServices = {
    createUserSubscription,
    getUserSubscriptions,
    getUserSubscriptionById,
    cancelUserSubscription,
    resumeUserSubscription,
};

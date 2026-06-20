import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { SubscriptionPlanModel } from "./subscription.model";
import { ISubscriptionPlan, SubscriptionDuration } from "./subscription.interface";
import { stripeServices } from "../stripe/stripe.service";

// Subscription Plan Services
const createSubscriptionPlan = async (data: Partial<ISubscriptionPlan>) => {
    let stripeProductId;
    let stripePriceId;

    if (data.isFreeTrial === false) {
        delete data.freeTrialDays;
    }

    if (data.price !== undefined) {
        // Create product and price on Stripe
        const product = await stripeServices.createProduct(data.name as string);
        stripeProductId = product.id;

        const interval = data.duration === SubscriptionDuration.MONTHLY ? "month" : data.duration === SubscriptionDuration.HALF_YEARLY ? "month" : "year";
        const amount = data.price * 100; // Stripe uses cents

        const price = await stripeServices.createPrice(stripeProductId, amount, "usd", interval);
        stripePriceId = price.id;
    }

    const planData = {
        ...data,
        stripeProductId,
        stripePriceId,
    };
    const plan = await SubscriptionPlanModel.create(planData);
    return plan;
};

const getAllSubscriptionPlans = async () => {
    const plans = await SubscriptionPlanModel.find();
    return plans;
};

const getSubscriptionPlanById = async (id: string) => {
    const plan = await SubscriptionPlanModel.findById(id);
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
    return plan;
};

const updateSubscriptionPlan = async (id: string, data: Partial<ISubscriptionPlan>) => {
    const updateQuery: any = { $set: data };
    if (data.isFreeTrial === false) {
        delete data.freeTrialDays;
        updateQuery.$unset = { freeTrialDays: "" };
    }

    const plan = await SubscriptionPlanModel.findByIdAndUpdate(id, updateQuery, { new: true, runValidators: true });
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
    return plan;
};

const deleteSubscriptionPlan = async (id: string) => {
    const plan = await SubscriptionPlanModel.findByIdAndDelete(id);
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
    return { message: "Subscription plan deleted successfully" };
};

const createCoupon = async (data: {
    id: string;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration?: "once" | "repeating" | "forever";
    durationInMonths?: number;
}) => {
    const coupon = await stripeServices.createCoupon(
        data.id,
        data.percentOff,
        data.amountOff,
        data.currency,
        data.duration,
        data.durationInMonths
    );
    return coupon;
};

export const subscriptionServices = {
    createSubscriptionPlan,
    getAllSubscriptionPlans,
    getSubscriptionPlanById,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    createCoupon,
};

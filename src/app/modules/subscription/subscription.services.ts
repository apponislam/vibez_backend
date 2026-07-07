import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { SubscriptionPlanModel } from "./subscription.model";
import { ISubscriptionPlan, SubscriptionDuration, UserSubscriptionStatus } from "./subscription.interface";
import { stripeServices } from "../stripe/stripe.service";
import { UserSubscriptionModel } from "../usersubscription/usersubscription.model";

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

        const price = await stripeServices.createPrice(stripeProductId, amount, "chf", interval);
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

    const plan = await SubscriptionPlanModel.findByIdAndUpdate(id, updateQuery, { returnDocument: 'after', runValidators: true });
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
    return plan;
};

const deleteSubscriptionPlan = async (id: string) => {
    const plan = await SubscriptionPlanModel.findByIdAndDelete(id);
    if (!plan) throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
    return { message: "Subscription plan deleted successfully" };
};

const getAdminSubscriptionStats = async () => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Start of last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Total Active Subscribers & Growth
    const totalActiveSubscribers = await UserSubscriptionModel.countDocuments({
        status: UserSubscriptionStatus.ACTIVE
    });

    const activeCreatedBeforeThisMonth = await UserSubscriptionModel.countDocuments({
        status: UserSubscriptionStatus.ACTIVE,
        createdAt: { $lt: startOfThisMonth }
    });

    let subscribersGrowth = 0;
    if (activeCreatedBeforeThisMonth > 0) {
        subscribersGrowth = ((totalActiveSubscribers - activeCreatedBeforeThisMonth) / activeCreatedBeforeThisMonth) * 100;
    } else if (totalActiveSubscribers > 0) {
        subscribersGrowth = 100;
    }
    const subscribersGrowthStr = `${subscribersGrowth >= 0 ? "+" : ""}${subscribersGrowth.toFixed(1)}% this month`;

    // 2. Monthly Revenue & Growth (Sum of purchased plan prices this month vs last month)
    const thisMonthSubscriptions = await UserSubscriptionModel.find({
        createdAt: { $gte: startOfThisMonth, $lte: now },
        isTrial: false
    }).populate("subscriptionPlanId").lean();

    const lastMonthSubscriptions = await UserSubscriptionModel.find({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        isTrial: false
    }).populate("subscriptionPlanId").lean();

    let thisMonthRevenue = 0;
    for (const sub of thisMonthSubscriptions) {
        const plan = sub.subscriptionPlanId as any;
        if (plan && typeof plan.price === "number") {
            thisMonthRevenue += plan.price;
        }
    }

    let lastMonthRevenue = 0;
    for (const sub of lastMonthSubscriptions) {
        const plan = sub.subscriptionPlanId as any;
        if (plan && typeof plan.price === "number") {
            lastMonthRevenue += plan.price;
        }
    }

    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
        revenueGrowth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (thisMonthRevenue > 0) {
        revenueGrowth = 100;
    }
    const revenueGrowthStr = `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% this month`;

    // Format monthly revenue string (e.g. €227K if >= 1000)
    let formattedRevenue = `€${thisMonthRevenue}`;
    if (thisMonthRevenue >= 1000) {
        formattedRevenue = `€${(thisMonthRevenue / 1000).toFixed(0)}K`;
    }

    // 3. Failed Payments (from Stripe with DB fallback)
    let failedPaymentsCount = 0;
    try {
        const unpaidInvoices = await stripeServices.stripe.invoices.list({
            status: "open",
            limit: 100
        });
        failedPaymentsCount = unpaidInvoices.data.length;
    } catch (err) {
        console.error("Failed to fetch unpaid invoices from Stripe:", err);
        // Fallback: count cancelled subscriptions in this month
        failedPaymentsCount = await UserSubscriptionModel.countDocuments({
            status: UserSubscriptionStatus.CANCELLED,
            updatedAt: { $gte: startOfThisMonth }
        });
    }

    const totalActiveForRate = totalActiveSubscribers > 0 ? totalActiveSubscribers : 1;
    const failureRate = (failedPaymentsCount / totalActiveForRate) * 100;
    const failedPaymentsChangeStr = `${failureRate.toFixed(1)}% failure rate`;

    // 4. Upcoming Renewals (next 7 days)
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    const upcomingRenewalsCount = await UserSubscriptionModel.countDocuments({
        status: UserSubscriptionStatus.ACTIVE,
        endDate: { $gte: now, $lte: next7Days }
    });

    return {
        totalSubscribers: {
            value: totalActiveSubscribers,
            change: subscribersGrowthStr
        },
        monthlyRevenue: {
            value: thisMonthRevenue,
            formattedValue: formattedRevenue,
            change: revenueGrowthStr
        },
        failedPayments: {
            value: failedPaymentsCount,
            change: failedPaymentsChangeStr
        },
        upcomingRenewals: {
            value: upcomingRenewalsCount,
            period: "Next 7 days"
        }
    };
};

export const subscriptionServices = {
    createSubscriptionPlan,
    getAllSubscriptionPlans,
    getSubscriptionPlanById,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    getAdminSubscriptionStats,
};

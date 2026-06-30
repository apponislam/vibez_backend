import { UserSubscriptionModel } from "../usersubscription/usersubscription.model";
import { SubscriptionPlanModel } from "../subscription/subscription.model";
import { UserModel } from "../auth/auth.model";
import { RestaurantModel } from "../restaurant/restaurant.model";
import { DealModel } from "../deal/deal.model";
import { ReservationModel } from "../reservation/reservation.model";
import { CommissionModel } from "../commission/commission.model";
import { WithdrawModel } from "../withdraw/withdraw.model";
import { WithdrawStatus } from "../withdraw/withdraw.interface";
import { SubscriptionDuration, UserSubscriptionStatus } from "../subscription/subscription.interface";
import { ReservationStatus } from "../reservation/reservation.interface";
import { Types } from "mongoose";

// Helper function to calculate affiliates count up to a certain date
const getAffiliatesCountUpToDate = async (endDate: Date) => {
    const influencerCount = await UserModel.countDocuments({
        isInfluencer: true,
        isDeleted: false,
        createdAt: { $lte: endDate }
    });

    const referredIds = await UserModel.distinct("referredBy", {
        referredBy: { $ne: null },
        isDeleted: false,
        createdAt: { $lte: endDate }
    });

    const normalCount = await UserModel.countDocuments({
        _id: { $in: referredIds },
        isInfluencer: { $ne: true },
        isDeleted: false,
        createdAt: { $lte: endDate }
    });

    return influencerCount + normalCount;
};

const getAdminDashboardStats = async () => {
    const now = new Date();

    // Months boundary
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Fetch active subscriptions
    const activeSubscriptions = await UserSubscriptionModel.find({
        status: UserSubscriptionStatus.ACTIVE
    }).populate("subscriptionPlanId").lean();

    // 1. Revenue Card Stats (All subscriptions)
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let annualRevenue = 0;

    for (const sub of activeSubscriptions) {
        if (sub.isTrial || !sub.subscriptionPlanId) continue;
        const plan = sub.subscriptionPlanId as any;
        if (plan && typeof plan.price === "number") {
            totalRevenue += plan.price;
            if (plan.duration === SubscriptionDuration.MONTHLY) {
                monthlyRevenue += plan.price;
            } else if (plan.duration === SubscriptionDuration.YEARLY) {
                annualRevenue += plan.price;
            }
        }
    }

    const thisMonthSubs = await UserSubscriptionModel.find({
        createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
        isTrial: false
    }).populate("subscriptionPlanId").lean();

    const lastMonthSubs = await UserSubscriptionModel.find({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        isTrial: false
    }).populate("subscriptionPlanId").lean();

    let thisMonthRevenue = 0;
    for (const sub of thisMonthSubs) {
        if (sub.subscriptionPlanId) {
            thisMonthRevenue += (sub.subscriptionPlanId as any).price || 0;
        }
    }

    let lastMonthRevenue = 0;
    for (const sub of lastMonthSubs) {
        if (sub.subscriptionPlanId) {
            lastMonthRevenue += (sub.subscriptionPlanId as any).price || 0;
        }
    }

    let revenueGrowthPercentage = 0;
    if (lastMonthRevenue > 0) {
        revenueGrowthPercentage = Number((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
    } else if (thisMonthRevenue > 0) {
        revenueGrowthPercentage = 100.0;
    }

    // 2. Active Subscribers Card Stats
    const totalActiveSubscribers = activeSubscriptions.length;
    const activeMonthlySubscribers = activeSubscriptions.filter(s => !s.isTrial && (s.subscriptionPlanId as any)?.duration === SubscriptionDuration.MONTHLY).length;
    const activeTrialSubscribers = activeSubscriptions.filter(s => s.isTrial).length;

    const thisMonthSubsCount = thisMonthSubs.length;
    const lastMonthSubsCount = lastMonthSubs.length;
    let subscribersGrowthPercentage = 0;
    if (lastMonthSubsCount > 0) {
        subscribersGrowthPercentage = Number((((thisMonthSubsCount - lastMonthSubsCount) / lastMonthSubsCount) * 100).toFixed(1));
    } else if (thisMonthSubsCount > 0) {
        subscribersGrowthPercentage = 100.0;
    }

    // 3. Referral Revenue Card Stats
    const paidReferredSubscriptions = await UserSubscriptionModel.find({
        commissionUser: { $ne: null },
        isTrial: false
    }).populate("subscriptionPlanId").lean();

    let totalReferralRevenue = 0;
    let thisMonthReferralRevenue = 0;
    let lastMonthReferralRevenue = 0;

    for (const sub of paidReferredSubscriptions) {
        const price = (sub.subscriptionPlanId as any)?.price || 0;
        totalReferralRevenue += price;

        const createdAt = new Date((sub as any).createdAt);
        if (createdAt >= thisMonthStart && createdAt <= thisMonthEnd) {
            thisMonthReferralRevenue += price;
        } else if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) {
            lastMonthReferralRevenue += price;
        }
    }

    let referralRevenueGrowthPercentage = 0;
    if (lastMonthReferralRevenue > 0) {
        referralRevenueGrowthPercentage = Number((((thisMonthReferralRevenue - lastMonthReferralRevenue) / lastMonthReferralRevenue) * 100).toFixed(1));
    } else if (thisMonthReferralRevenue > 0) {
        referralRevenueGrowthPercentage = 100.0;
    }

    // 4. Total Affiliates Card Stats
    const influencerAffiliates = await UserModel.countDocuments({
        isInfluencer: true,
        isDeleted: false
    });

    const referredByIds = await UserModel.distinct("referredBy", {
        referredBy: { $ne: null },
        isDeleted: false
    });

    const normalAffiliates = await UserModel.countDocuments({
        _id: { $in: referredByIds },
        isInfluencer: { $ne: true },
        isDeleted: false
    });

    const totalAffiliates = influencerAffiliates + normalAffiliates;

    const affiliatesEndLastMonth = await getAffiliatesCountUpToDate(lastMonthEnd);
    const affiliatesEndThisMonth = await getAffiliatesCountUpToDate(now);
    const newAffiliatesThisMonth = affiliatesEndThisMonth - affiliatesEndLastMonth;

    let affiliatesGrowthPercentage = 0;
    if (affiliatesEndLastMonth > 0) {
        affiliatesGrowthPercentage = Number(((newAffiliatesThisMonth / affiliatesEndLastMonth) * 100).toFixed(1));
    } else if (newAffiliatesThisMonth > 0) {
        affiliatesGrowthPercentage = 100.0;
    }

    // 5. Active Referral Subscriptions Card Stats
    const totalActiveReferralSubscriptions = await UserSubscriptionModel.countDocuments({
        commissionUser: { $ne: null },
        status: UserSubscriptionStatus.ACTIVE
    });

    const thisMonthActiveReferralSubs = await UserSubscriptionModel.countDocuments({
        commissionUser: { $ne: null },
        status: UserSubscriptionStatus.ACTIVE,
        createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd }
    });

    const lastMonthActiveReferralSubs = await UserSubscriptionModel.countDocuments({
        commissionUser: { $ne: null },
        status: UserSubscriptionStatus.ACTIVE,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    let activeReferralSubsGrowthPercentage = 0;
    if (lastMonthActiveReferralSubs > 0) {
        activeReferralSubsGrowthPercentage = Number((((thisMonthActiveReferralSubs - lastMonthActiveReferralSubs) / lastMonthActiveReferralSubs) * 100).toFixed(1));
    } else if (thisMonthActiveReferralSubs > 0) {
        activeReferralSubsGrowthPercentage = 100.0;
    }

    // 6. Total Commission Paid Card Stats
    const approvedWithdrawals = await WithdrawModel.aggregate([
        { $match: { status: WithdrawStatus.APPROVED } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalCommissionPaid = approvedWithdrawals[0]?.total || 0;

    const pendingWithdrawals = await WithdrawModel.aggregate([
        { $match: { status: WithdrawStatus.PENDING } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const pendingCommission = pendingWithdrawals[0]?.total || 0;

    // 7. Active Restaurants Card Stats
    const allRestaurants = await RestaurantModel.find().populate({
        path: "restaurantOwner",
        select: "isActive"
    }).lean();

    let activeRestaurants = 0;
    let pendingRestaurants = 0;
    let suspendedRestaurants = 0;

    for (const r of allRestaurants) {
        const owner = r.restaurantOwner as any;
        const isOwnerActive = owner ? owner.isActive !== false : true;

        if (!isOwnerActive) {
            suspendedRestaurants++;
        } else if (r.approved) {
            activeRestaurants++;
        } else {
            pendingRestaurants++;
        }
    }

    // 8. Active Deals Card Stats
    const [activeDeals, draftDeals] = await Promise.all([
        DealModel.countDocuments({ isActive: true, isDeleted: false }),
        DealModel.countDocuments({ isActive: false, isDeleted: false }),
    ]);

    // 9. Total Bookings Card Stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [totalBookings, todayBookings, weeklyBookings] = await Promise.all([
        ReservationModel.countDocuments({ status: { $ne: ReservationStatus.CANCELLED } }),
        ReservationModel.countDocuments({
            status: { $ne: ReservationStatus.CANCELLED },
            reservationDate: { $gte: todayStart, $lte: todayEnd }
        }),
        ReservationModel.countDocuments({
            status: { $ne: ReservationStatus.CANCELLED },
            reservationDate: { $gte: sevenDaysAgo, $lte: todayEnd }
        }),
    ]);

    const [thisMonthBookings, lastMonthBookings] = await Promise.all([
        ReservationModel.countDocuments({
            status: { $ne: ReservationStatus.CANCELLED },
            createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd }
        }),
        ReservationModel.countDocuments({
            status: { $ne: ReservationStatus.CANCELLED },
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
        }),
    ]);

    let bookingsGrowthPercentage = 0;
    if (lastMonthBookings > 0) {
        bookingsGrowthPercentage = Number((((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(1));
    } else if (thisMonthBookings > 0) {
        bookingsGrowthPercentage = 100.0;
    }

    return {
        revenue: {
            totalRevenue: Number(totalRevenue.toFixed(2)),
            monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
            annualRevenue: Number(annualRevenue.toFixed(2)),
            growthPercentage: revenueGrowthPercentage,
        },
        subscribers: {
            totalActiveSubscribers,
            activeMonthlySubscribers,
            activeTrialSubscribers,
            growthPercentage: subscribersGrowthPercentage,
        },
        referralRevenue: {
            totalReferralRevenue: Number(totalReferralRevenue.toFixed(2)),
            thisMonthReferralRevenue: Number(thisMonthReferralRevenue.toFixed(2)),
            growthPercentage: referralRevenueGrowthPercentage,
        },
        affiliates: {
            totalAffiliates,
            normalAffiliates,
            influencerAffiliates,
            growthPercentage: affiliatesGrowthPercentage,
        },
        activeReferralSubscriptions: {
            totalActiveReferralSubscriptions,
            growthPercentage: activeReferralSubsGrowthPercentage,
        },
        commissions: {
            totalCommissionPaid: Number(totalCommissionPaid.toFixed(2)),
            pendingCommission: Number(pendingCommission.toFixed(2)),
        },
        restaurants: {
            activeRestaurants,
            pendingRestaurants,
            suspendedRestaurants,
        },
        deals: {
            activeDeals,
            expiringToday: 0,
            draftDeals,
        },
        bookings: {
            totalBookings,
            todayBookings,
            weeklyBookings,
            growthPercentage: bookingsGrowthPercentage,
        }
    };
};

export const dashboardServices = {
    getAdminDashboardStats,
};

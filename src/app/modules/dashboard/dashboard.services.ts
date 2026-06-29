import { UserSubscriptionModel } from "../usersubscription/usersubscription.model";
import { SubscriptionPlanModel } from "../subscription/subscription.model";
import { UserModel } from "../auth/auth.model";
import { RestaurantModel } from "../restaurant/restaurant.model";
import { DealModel } from "../deal/deal.model";
import { ReservationModel } from "../reservation/reservation.model";
import { CommissionModel } from "../commission/commission.model";
import { SubscriptionDuration, UserSubscriptionStatus } from "../subscription/subscription.interface";
import { ReservationStatus } from "../reservation/reservation.interface";
import { Types } from "mongoose";

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

    // 1. Revenue Card Stats
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
    let totalReferralRevenue = 0;
    for (const sub of activeSubscriptions) {
        if (sub.commissionUser && !sub.isTrial && sub.subscriptionPlanId) {
            totalReferralRevenue += (sub.subscriptionPlanId as any).price || 0;
        }
    }

    const commissionStats = await CommissionModel.aggregate([
        { $group: { _id: null, total: { $sum: "$maxPayout" } } }
    ]);
    const totalCommissionPaid = commissionStats[0]?.total || 0;

    let thisMonthReferralRevenue = 0;
    for (const sub of thisMonthSubs) {
        if (sub.commissionUser && sub.subscriptionPlanId) {
            thisMonthReferralRevenue += (sub.subscriptionPlanId as any).price || 0;
        }
    }

    let lastMonthReferralRevenue = 0;
    for (const sub of lastMonthSubs) {
        if (sub.commissionUser && sub.subscriptionPlanId) {
            lastMonthReferralRevenue += (sub.subscriptionPlanId as any).price || 0;
        }
    }

    let referralRevenueGrowthPercentage = 0;
    if (lastMonthReferralRevenue > 0) {
        referralRevenueGrowthPercentage = Number((((thisMonthReferralRevenue - lastMonthReferralRevenue) / lastMonthReferralRevenue) * 100).toFixed(1));
    } else if (thisMonthReferralRevenue > 0) {
        referralRevenueGrowthPercentage = 100.0;
    }

    // 4. Active Restaurants Card Stats
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

    // 5. Active Deals Card Stats
    const [activeDeals, draftDeals] = await Promise.all([
        DealModel.countDocuments({ isActive: true, isDeleted: false }),
        DealModel.countDocuments({ isActive: false, isDeleted: false }),
    ]);

    // 6. Total Bookings Card Stats
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
            totalCommissionPaid: Number(totalCommissionPaid.toFixed(2)),
            growthPercentage: referralRevenueGrowthPercentage,
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

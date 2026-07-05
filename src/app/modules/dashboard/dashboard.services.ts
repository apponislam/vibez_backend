import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
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

const getAffiliateStats = async () => {
    const now = new Date();

    // Months boundary
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Total Referral Revenue
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

    // 2. Total Affiliates
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

    // 3. Active Referral Subscriptions
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

    // 4. Total Commission Paid
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

    return {
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
        }
    };
};

const getRestaurantOwnerDashboardStats = async (user: { _id: string; role: string; restaurantId?: any }) => {
    let restaurantId = user.restaurantId;

    if (!restaurantId && user.role === "RESTAURANT_OWNER") {
        const restaurant = await RestaurantModel.findOne({ restaurantOwner: user._id });
        if (restaurant) {
            restaurantId = restaurant._id;
        }
    }

    if (!restaurantId) {
        throw new ApiError(httpStatus.FORBIDDEN, "User is not associated with any restaurant");
    }

    const restaurantObjectId = new Types.ObjectId(restaurantId);

    // 1. Calculate Average Guests per Booking and compare with last week
    const now = new Date();

    // Start of this week (Sunday 00:00:00)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Start of last week (7 days before start of this week)
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const [allTimeStats, thisWeekStats, lastWeekStats] = await Promise.all([
        ReservationModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    status: { $ne: ReservationStatus.CANCELLED },
                },
            },
            {
                $group: {
                    _id: null,
                    averagePartySize: { $avg: "$partySize" },
                },
            },
        ]),
        ReservationModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    status: { $ne: ReservationStatus.CANCELLED },
                    reservationDate: { $gte: startOfThisWeek },
                },
            },
            {
                $group: {
                    _id: null,
                    averagePartySize: { $avg: "$partySize" },
                },
            },
        ]),
        ReservationModel.aggregate([
            {
                $match: {
                    restaurantId: restaurantObjectId,
                    status: { $ne: ReservationStatus.CANCELLED },
                    reservationDate: { $gte: startOfLastWeek, $lt: startOfThisWeek },
                },
            },
            {
                $group: {
                    _id: null,
                    averagePartySize: { $avg: "$partySize" },
                },
            },
        ]),
    ]);

    const averageAllTime = allTimeStats[0]?.averagePartySize || 0;
    const averageThisWeek = thisWeekStats[0]?.averagePartySize || averageAllTime;
    const averageLastWeek = lastWeekStats[0]?.averagePartySize || 0;

    let averageGuests = {
        average: Number(averageThisWeek.toFixed(1)),
        change: "0.0 from last week",
    };

    if (averageLastWeek > 0) {
        const diff = averageThisWeek - averageLastWeek;
        const sign = diff >= 0 ? "↑" : "↓";
        averageGuests.change = `${sign} ${Math.abs(diff).toFixed(1)} from last week`;
    } else if (averageThisWeek > 0) {
        averageGuests.change = `↑ ${averageThisWeek.toFixed(1)} from last week`;
    }

    // 2. Calculate Peak Time (Meal time category and most popular 1.5 hr range)
    const reservations = await ReservationModel.find({
        restaurantId: restaurantObjectId,
        status: { $ne: ReservationStatus.CANCELLED },
    }).select("reservationTime");

    let peakTime = {
        mealTime: "N/A",
        timeRange: "N/A",
    };

    if (reservations.length > 0) {
        const timeCounts: { [key: string]: number } = {};
        for (const res of reservations) {
            const time = res.reservationTime;
            if (time) {
                timeCounts[time] = (timeCounts[time] || 0) + 1;
            }
        }

        let peakTimeStr = "";
        let maxCount = 0;
        for (const [time, count] of Object.entries(timeCounts)) {
            if (count > maxCount) {
                maxCount = count;
                peakTimeStr = time;
            }
        }

        if (peakTimeStr) {
            const [hourStr, minStr] = peakTimeStr.split(":");
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minStr, 10);

            let mealTime = "All Day";
            if (hour >= 11 && hour < 16) {
                mealTime = "Lunch";
            } else if (hour >= 17 && hour < 23) {
                mealTime = "Dinner";
            }

            const format12Hour = (h: number, m: number) => {
                const ampm = h >= 12 ? "PM" : "AM";
                const displayHour = h % 12 === 0 ? 12 : h % 12;
                const displayMinute = m.toString().padStart(2, "0");
                return `${displayHour}:${displayMinute} ${ampm}`;
            };

            const startTimeFormatted = format12Hour(hour, minute);

            let endHour = hour + 1;
            let endMinute = minute + 30;
            if (endMinute >= 60) {
                endHour += 1;
                endMinute -= 60;
            }
            if (endHour >= 24) {
                endHour -= 24;
            }
            const endTimeFormatted = format12Hour(endHour, endMinute);

            peakTime = {
                mealTime,
                timeRange: `${startTimeFormatted} - ${endTimeFormatted}`,
            };
        }
    }

    // 3. Calculate Most Popular Deal and percentage usage increase
    const dealStats = await ReservationModel.aggregate([
        {
            $match: {
                restaurantId: restaurantObjectId,
                status: { $ne: ReservationStatus.CANCELLED },
                dealId: { $ne: null },
            },
        },
        {
            $group: {
                _id: "$dealId",
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
    ]);

    let mostPopularDeal = {
        title: "N/A",
        totalClaims: 0,
        usageChange: "0%",
    };

    if (dealStats.length > 0) {
        const dealId = dealStats[0]._id;
        const totalClaims = dealStats[0].count;
        const deal = await DealModel.findById(dealId);

        if (deal) {
            const [claimsThisWeek, claimsLastWeek] = await Promise.all([
                ReservationModel.countDocuments({
                    restaurantId: restaurantObjectId,
                    dealId,
                    status: { $ne: ReservationStatus.CANCELLED },
                    reservationDate: { $gte: startOfThisWeek },
                }),
                ReservationModel.countDocuments({
                    restaurantId: restaurantObjectId,
                    dealId,
                    status: { $ne: ReservationStatus.CANCELLED },
                    reservationDate: { $gte: startOfLastWeek, $lt: startOfThisWeek },
                }),
            ]);

            let usageChange = "0%";
            if (claimsLastWeek > 0) {
                const diff = ((claimsThisWeek - claimsLastWeek) / claimsLastWeek) * 100;
                usageChange = `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`;
            } else if (claimsThisWeek > 0) {
                usageChange = "+100%";
            }

            mostPopularDeal = {
                title: deal.title,
                totalClaims,
                usageChange,
            };
        }
    }

    return {
        mostPopularDeal,
        peakTime,
        averageGuests,
    };
};

export const dashboardServices = {
    getAdminDashboardStats,
    getAffiliateStats,
    getRestaurantOwnerDashboardStats,
};

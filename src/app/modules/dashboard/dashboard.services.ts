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
import { SavedDealModel } from "../saved-deal/saved-deal.model";
import { ReviewModel } from "../review/review.model";
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
        const price = typeof sub.paidPrice === "number" ? sub.paidPrice : (plan?.price || 0);
        totalRevenue += price;
        if (plan) {
            if (plan.duration === SubscriptionDuration.MONTHLY) {
                monthlyRevenue += price;
            } else if (plan.duration === SubscriptionDuration.YEARLY || plan.duration === SubscriptionDuration.TWO_YEARLY) {
                annualRevenue += price;
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
        if (typeof sub.paidPrice === "number") {
            thisMonthRevenue += sub.paidPrice;
        } else if (sub.subscriptionPlanId) {
            thisMonthRevenue += (sub.subscriptionPlanId as any).price || 0;
        }
    }

    let lastMonthRevenue = 0;
    for (const sub of lastMonthSubs) {
        if (typeof sub.paidPrice === "number") {
            lastMonthRevenue += sub.paidPrice;
        } else if (sub.subscriptionPlanId) {
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
            totalReferralRevenue += typeof sub.paidPrice === "number" ? sub.paidPrice : ((sub.subscriptionPlanId as any).price || 0);
        }
    }

    const commissionStats = await CommissionModel.aggregate([
        { $group: { _id: null, total: { $sum: "$maxPayout" } } }
    ]);
    const totalCommissionPaid = commissionStats[0]?.total || 0;

    let thisMonthReferralRevenue = 0;
    for (const sub of thisMonthSubs) {
        if (sub.commissionUser && sub.subscriptionPlanId) {
            thisMonthReferralRevenue += typeof sub.paidPrice === "number" ? sub.paidPrice : ((sub.subscriptionPlanId as any).price || 0);
        }
    }

    let lastMonthReferralRevenue = 0;
    for (const sub of lastMonthSubs) {
        if (sub.commissionUser && sub.subscriptionPlanId) {
            lastMonthReferralRevenue += typeof sub.paidPrice === "number" ? sub.paidPrice : ((sub.subscriptionPlanId as any).price || 0);
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
        const price = typeof sub.paidPrice === "number" ? sub.paidPrice : ((sub.subscriptionPlanId as any)?.price || 0);
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
        change: 0,
    };

    if (averageLastWeek > 0) {
        const diff = averageThisWeek - averageLastWeek;
        averageGuests.change = Number(diff.toFixed(1));
    } else if (averageThisWeek > 0) {
        averageGuests.change = Number(averageThisWeek.toFixed(1));
    }

    // Peak Time (Meal time category and most popular 1.5 hr range)
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

    // Calculate Most Popular Deal and percentage usage increase
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
        usageChange: 0,
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

            let usageChange = 0;
            if (claimsLastWeek > 0) {
                const diff = ((claimsThisWeek - claimsLastWeek) / claimsLastWeek) * 100;
                usageChange = Number(diff.toFixed(0));
            } else if (claimsThisWeek > 0) {
                usageChange = 100;
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

const getRestaurantOwnerOverview = async (user: { _id: string; role: string; restaurantId?: any }) => {
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

    // Get deals of the restaurant first to calculate saved deals (claims)
    const deals = await DealModel.find({ restaurantId: restaurantObjectId }).select("_id");
    const dealIds = deals.map(d => d._id);

    const totalSaved = await SavedDealModel.countDocuments({ dealId: { $in: dealIds } });
    
    const totalUsed = await ReservationModel.countDocuments({
        restaurantId: restaurantObjectId,
        dealId: { $ne: null },
        status: { $ne: ReservationStatus.CANCELLED }
    });

    const now = new Date();

    // Start of this week (Sunday 00:00:00)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Start of last week (7 days before start of this week)
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Saved deals this week and last week
    const [savedThisWeek, savedLastWeek] = await Promise.all([
        SavedDealModel.countDocuments({
            dealId: { $in: dealIds },
            createdAt: { $gte: startOfThisWeek }
        }),
        SavedDealModel.countDocuments({
            dealId: { $in: dealIds },
            createdAt: { $gte: startOfLastWeek, $lt: startOfThisWeek }
        })
    ]);

    // Used deals (reservations) this week and last week
    const [usedThisWeek, usedLastWeek] = await Promise.all([
        ReservationModel.countDocuments({
            restaurantId: restaurantObjectId,
            dealId: { $ne: null },
            status: { $ne: ReservationStatus.CANCELLED },
            createdAt: { $gte: startOfThisWeek }
        }),
        ReservationModel.countDocuments({
            restaurantId: restaurantObjectId,
            dealId: { $ne: null },
            status: { $ne: ReservationStatus.CANCELLED },
            createdAt: { $gte: startOfLastWeek, $lt: startOfThisWeek }
        })
    ]);

    const claimsThisWeek = savedThisWeek + usedThisWeek;
    const claimsLastWeek = savedLastWeek + usedLastWeek;
    const totalClaimsAllTime = totalSaved + totalUsed;

    let claimsChange = "0%";
    if (claimsLastWeek > 0) {
        const diff = ((claimsThisWeek - claimsLastWeek) / claimsLastWeek) * 100;
        claimsChange = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    } else if (claimsThisWeek > 0) {
        claimsChange = "+100%";
    }

    const totalClaims = {
        value: totalClaimsAllTime,
        growth: claimsChange
    };

    // Calculate Conversion Rate
    const conversionRateAllTime = totalClaimsAllTime > 0
        ? Number(((totalUsed / totalClaimsAllTime) * 100).toFixed(1))
        : 0;

    const conversionRateThisWeek = claimsThisWeek > 0
        ? Number(((usedThisWeek / claimsThisWeek) * 100).toFixed(1))
        : 0;

    const conversionRateLastWeek = claimsLastWeek > 0
        ? Number(((usedLastWeek / claimsLastWeek) * 100).toFixed(1))
        : 0;

    let conversionChange = "0%";
    if (conversionRateLastWeek > 0) {
        const diff = conversionRateThisWeek - conversionRateLastWeek;
        conversionChange = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    } else if (conversionRateThisWeek > 0) {
        conversionChange = `+${conversionRateThisWeek.toFixed(1)}%`;
    }

    const conversionRate = {
        value: conversionRateAllTime,
        growth: conversionChange
    };

    // Calculate Peak Hours (Meal time category and most popular 2 hr range)
    const reservations = await ReservationModel.find({
        restaurantId: restaurantObjectId,
        status: { $ne: ReservationStatus.CANCELLED },
    }).select("reservationTime");

    let peakHours = {
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

            let mealTime = "All Day";
            if (hour >= 11 && hour < 16) {
                mealTime = "Lunch";
            } else if (hour >= 17 && hour < 23) {
                mealTime = "Dinner";
            }

            const startHour = hour;
            const endHour = (hour + 2) % 24;
            const startAMPM = startHour >= 12 ? "PM" : "AM";
            const endAMPM = endHour >= 12 ? "PM" : "AM";

            const startDisplay = startHour % 12 === 0 ? 12 : startHour % 12;
            const endDisplay = endHour % 12 === 0 ? 12 : endHour % 12;

            let timeRange = "";
            if (startAMPM === endAMPM) {
                timeRange = `${startDisplay}-${endDisplay} ${startAMPM}`;
            } else {
                timeRange = `${startDisplay} ${startAMPM} - ${endDisplay} ${endAMPM}`;
            }

            peakHours = {
                mealTime,
                timeRange,
            };
        }
    }

    // Calculate Most Popular Deal
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
        claims: 0,
    };

    if (dealStats.length > 0) {
        const dealId = dealStats[0]._id;
        const totalUsedClaims = dealStats[0].count;
        const deal = await DealModel.findById(dealId);

        if (deal) {
            const totalSavedClaims = await SavedDealModel.countDocuments({ dealId });
            mostPopularDeal = {
                title: deal.title,
                claims: totalUsedClaims + totalSavedClaims,
            };
        }
    }

    return {
        totalClaims,
        conversionRate,
        peakHours,
        mostPopularDeal,
    };
};

const getRestaurantOwnerBookingsPerDay = async (user: { _id: string; role: string; restaurantId?: any }) => {
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
    const now = new Date();

    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const mondayOfCurrentWeek = new Date(now);
    mondayOfCurrentWeek.setDate(now.getDate() + distanceToMonday);
    mondayOfCurrentWeek.setHours(0, 0, 0, 0);

    const sundayOfCurrentWeek = new Date(mondayOfCurrentWeek);
    sundayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);
    sundayOfCurrentWeek.setHours(23, 59, 59, 999);

    const currentWeekReservations = await ReservationModel.find({
        restaurantId: restaurantObjectId,
        status: { $ne: ReservationStatus.CANCELLED },
        reservationDate: { $gte: mondayOfCurrentWeek, $lte: sundayOfCurrentWeek },
    }).select("reservationDate").lean();

    const fixedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const bookingsPerDay = fixedDays.map((day, index) => {
        const date = new Date(mondayOfCurrentWeek);
        date.setDate(mondayOfCurrentWeek.getDate() + index);
        const dateStr = date.toISOString().split("T")[0];
        return {
            day,
            date: dateStr,
            count: 0,
        };
    });

    for (const res of currentWeekReservations) {
        const resDate = new Date(res.reservationDate);
        const resDateStr = resDate.toISOString().split("T")[0];
        const dayEntry = bookingsPerDay.find((d) => d.date === resDateStr);
        if (dayEntry) {
            dayEntry.count++;
        }
    }

    return bookingsPerDay;
};

const getRestaurantOwnerMealTimeStats = async (user: { _id: string; role: string; restaurantId?: any }) => {
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

    const reservations = await ReservationModel.find({
        restaurantId: restaurantObjectId,
        status: { $ne: ReservationStatus.CANCELLED },
    }).select("reservationTime");

    let lunchCount = 0;
    let dinnerCount = 0;

    for (const res of reservations) {
        const time = res.reservationTime;
        if (time) {
            const [hourStr] = time.split(":");
            const hour = parseInt(hourStr, 10);
            // Lunch: 11:00 AM to 3:59 PM (11:00 - 15:59)
            // Dinner: Otherwise (after 4:00 PM or early morning)
            if (hour >= 11 && hour < 16) {
                lunchCount++;
            } else {
                dinnerCount++;
            }
        }
    }

    const total = lunchCount + dinnerCount;
    const lunchPercentage = total > 0 ? Number(((lunchCount / total) * 100).toFixed(1)) : 0;
    const dinnerPercentage = total > 0 ? Number(((dinnerCount / total) * 100).toFixed(1)) : 0;

    return [
        { name: "Lunch", value: lunchCount, percentage: lunchPercentage },
        { name: "Dinner", value: dinnerCount, percentage: dinnerPercentage },
    ];
};

const getRestaurantOwnerInsights = async (user: { _id: string; role: string; restaurantId?: any }) => {
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

    // 1. Top Performing Deals (limit 3, order by total claims [saved + used])
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
                usedClaims: { $sum: 1 },
            },
        },
        { $sort: { usedClaims: -1 } },
        { $limit: 3 },
    ]);

    const topPerformingDeals = [];
    for (const stat of dealStats) {
        const deal = await DealModel.findById(stat._id);
        if (deal) {
            const savedClaims = await SavedDealModel.countDocuments({ dealId: stat._id });
            topPerformingDeals.push({
                title: deal.title,
                claims: stat.usedClaims + savedClaims,
            });
        }
    }
    // Sort in memory in case saved deals alter ranking
    topPerformingDeals.sort((a, b) => b.claims - a.claims);

    // 2. Weekly Insights - Best Day (of current calendar week, based on total partySize)
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const mondayOfCurrentWeek = new Date(now);
    mondayOfCurrentWeek.setDate(now.getDate() + distanceToMonday);
    mondayOfCurrentWeek.setHours(0, 0, 0, 0);

    const sundayOfCurrentWeek = new Date(mondayOfCurrentWeek);
    sundayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);
    sundayOfCurrentWeek.setHours(23, 59, 59, 999);

    const currentWeekReservations = await ReservationModel.find({
        restaurantId: restaurantObjectId,
        status: { $ne: ReservationStatus.CANCELLED },
        reservationDate: { $gte: mondayOfCurrentWeek, $lte: sundayOfCurrentWeek },
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayCustomerSums: { [key: string]: number } = {};

    for (const name of dayNames) {
        dayCustomerSums[name] = 0;
    }

    for (const res of currentWeekReservations) {
        const dayIndex = new Date(res.reservationDate).getDay();
        const dayName = dayNames[dayIndex];
        dayCustomerSums[dayName] += res.partySize || 0;
    }

    let bestDayName = "N/A";
    let maxCustomers = 0;
    for (const [dayName, sum] of Object.entries(dayCustomerSums)) {
        if (sum > maxCustomers) {
            maxCustomers = sum;
            bestDayName = dayName;
        }
    }

    const bestDay = {
        day: bestDayName,
        mostCount: maxCustomers
    };

    // 3. Customer Satisfaction (Average Rating of active, non-deleted reviews)
    const reviews = await ReviewModel.aggregate([
        {
            $match: {
                restaurantId: restaurantObjectId,
                isDeleted: false,
                isActive: true,
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
            },
        },
    ]);

    const rawRating = reviews[0]?.averageRating || 0;
    const customerSatisfaction = rawRating > 0 ? Number(rawRating.toFixed(1)) : 0.0;

    return {
        topPerformingDeals,
        weeklyInsights: {
            bestDay,
        },
        customerSatisfaction,
    };
};

const getRestaurantRealtimeStatsById = async (restaurantId: string) => {
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    const now = new Date();

    // 1. Total Bookings Today & Change from yesterday
    const getBookingsCountForDate = async (date: Date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return await ReservationModel.countDocuments({
            restaurantId: restaurantObjectId,
            status: { $ne: ReservationStatus.CANCELLED },
            reservationDate: { $gte: start, $lte: end },
        });
    };

    const todayBookings = await getBookingsCountForDate(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayBookings = await getBookingsCountForDate(yesterday);
    const bookingsChange = todayBookings - yesterdayBookings;
    const bookingsChangeStr = `${bookingsChange >= 0 ? "+" : ""}${bookingsChange} from yesterday`;

    // 2. Active Deals & Change from yesterday (or status)
    const activeDeals = await DealModel.countDocuments({
        restaurantId: restaurantObjectId,
        isActive: true,
        isDeleted: false,
    });

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const yesterdayActiveDeals = await DealModel.countDocuments({
        restaurantId: restaurantObjectId,
        createdAt: { $lt: startOfToday },
        $or: [
            { isActive: true, isDeleted: false },
            { updatedAt: { $gte: startOfToday } }, // If updated today, it might have been active yesterday
        ],
    });

    const dealsDiff = activeDeals - yesterdayActiveDeals;
    const activeDealsChangeStr = dealsDiff === 0 ? "Stable" : `${dealsDiff >= 0 ? "+" : ""}${dealsDiff} from yesterday`;

    // 3. Total Customers Served This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const customerServedResult = await ReservationModel.aggregate([
        {
            $match: {
                restaurantId: restaurantObjectId,
                status: { $in: [ReservationStatus.COMPLETED, ReservationStatus.ARRIVED] },
                reservationDate: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$partySize" },
            },
        },
    ]);
    const totalCustomersServedThisMonth = customerServedResult[0]?.total || 0;

    // 4. Staff Online Now & Status
    let staffOnlineNow = 0;
    let staffStatus = "No staff online";
    try {
        const { getOnlineUserIds } = require("../../socket/socket");
        const onlineUserIds = getOnlineUserIds();
        
        staffOnlineNow = await UserModel.countDocuments({
            restaurantId: restaurantObjectId,
            role: "STAFF",
            isDeleted: false,
            _id: { $in: onlineUserIds },
        });

        const totalStaffCount = await UserModel.countDocuments({
            restaurantId: restaurantObjectId,
            role: "STAFF",
            isDeleted: false,
        });

        if (staffOnlineNow === 0) {
            staffStatus = "No staff online";
        } else if (staffOnlineNow === totalStaffCount && totalStaffCount > 0) {
            staffStatus = "Full capacity";
        } else {
            staffStatus = `${staffOnlineNow} of ${totalStaffCount} online`;
        }
    } catch (err) {
        console.error("Error calculating online staff statistics:", err);
    }

    return {
        totalBookingsToday: {
            count: todayBookings,
            change: bookingsChangeStr,
        },
        activeDeals: {
            count: activeDeals,
            change: activeDealsChangeStr,
        },
        totalCustomersServed: {
            count: totalCustomersServedThisMonth,
            period: "This month",
        },
        staffOnlineNow: {
            count: staffOnlineNow,
            status: staffStatus,
        },
    };
};

const getRestaurantRealtimeStats = async (user: { _id: string; role: string; restaurantId?: any }) => {
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

    return await getRestaurantRealtimeStatsById(restaurantId.toString());
};

const broadcastRestaurantStats = async (restaurantId: string) => {
    try {
        const stats = await getRestaurantRealtimeStatsById(restaurantId);
        const { getSocket } = require("../../socket/socket");
        const io = getSocket();
        io.to(`restaurant_${restaurantId}`).emit("restaurant_stats", stats);
    } catch (err) {
        console.error(`Error broadcasting stats for restaurant ${restaurantId}:`, err);
    }
};

const getAdminRestaurantStats = async () => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total Restaurants & Growth
    const totalApprovedRestaurants = await RestaurantModel.countDocuments({ approved: true });
    
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const approvedThisMonth = await RestaurantModel.countDocuments({
        approved: true,
        approvedAt: { $gte: startOfThisMonth }
    });

    const approvedLastMonth = await RestaurantModel.countDocuments({
        approved: true,
        approvedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    const diff = approvedThisMonth - approvedLastMonth;
    const restaurantsChangeStr = `${diff >= 0 ? "+" : ""}${diff}`;

    // 2. Pending Approvals & Growth status
    const pendingApprovalsCount = await RestaurantModel.countDocuments({ approved: false });
    const pendingChangeStr = pendingApprovalsCount > 0 ? "Requires attention" : "Stable";

    // 3. Avg Performance (Redemption rate: claims to reservations ratio)
    const totalSaved = await SavedDealModel.countDocuments();
    const totalUsed = await ReservationModel.countDocuments({
        dealId: { $ne: null },
        status: { $ne: ReservationStatus.CANCELLED }
    });

    const totalClaimsAllTime = totalSaved + totalUsed;
    const avgPerformance = totalClaimsAllTime > 0 ? (totalUsed / totalClaimsAllTime) * 100 : 0;
    const avgPerformanceStr = `${avgPerformance.toFixed(1)}%`;

    return {
        totalRestaurants: {
            value: totalApprovedRestaurants,
            change: restaurantsChangeStr
        },
        pendingApprovals: {
            value: pendingApprovalsCount,
            change: pendingChangeStr
        },
        avgPerformance: {
            value: avgPerformanceStr,
            change: "Redemption rate"
        }
    };
};

export const dashboardServices = {
    getAdminDashboardStats,
    getAffiliateStats,
    getRestaurantOwnerDashboardStats,
    getRestaurantOwnerBookingsPerDay,
    getRestaurantOwnerMealTimeStats,
    getRestaurantOwnerOverview,
    getRestaurantOwnerInsights,
    getRestaurantRealtimeStatsById,
    getRestaurantRealtimeStats,
    broadcastRestaurantStats,
    getAdminRestaurantStats,
};

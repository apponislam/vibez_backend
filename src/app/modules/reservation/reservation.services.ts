import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ReservationModel } from "./reservation.model";
import { IReservation, ReservationStatus } from "./reservation.interface";
import { DealModel } from "../deal/deal.model";
import { DayOfWeek, MealTimeType } from "../deal/deal.interface";
import { restaurantServices } from "../restaurant/restaurant.services";
import { SavedDealModel } from "../saved-deal/saved-deal.model";
import { ReviewModel } from "../review/review.model";
import { dashboardServices } from "../dashboard/dashboard.services";

const createReservation = async (data: Partial<IReservation>, userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservationDate = new Date(data.reservationDate as Date);
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Reservation date can't be in the past");
    }

    // Validate deal if provided
    if (data.dealId) {
        const deal = await DealModel.findById(data.dealId);
        if (!deal) {
            throw new ApiError(httpStatus.NOT_FOUND, "Deal not found");
        }

        // Check if deal is active
        if (!deal.isActive || deal.isDeleted) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Deal is not active");
        }

        // Check if deal belongs to the same restaurant as reservation
        if (deal.restaurantId.toString() !== data.restaurantId?.toString()) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Deal does not belong to this restaurant");
        }

        // Check day of week matches
        const reservationDay = reservationDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase() as DayOfWeek;
        if (deal.day !== reservationDay) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Deal is only available on ${deal.day}`);
        }

        // Check reservation time falls within deal's meal time
        const reservationTime = data.reservationTime as string;
        if (deal.mealTime !== MealTimeType.ALL_DAY) {
            if (deal.mealTime === MealTimeType.LUNCH) {
                if (reservationTime < "11:00" || reservationTime > "15:00") {
                    throw new ApiError(httpStatus.BAD_REQUEST, "Deal is only available for lunch (11:00 - 15:00)");
                }
            } else if (deal.mealTime === MealTimeType.DINNER) {
                if (reservationTime < "17:00" || reservationTime > "22:00") {
                    throw new ApiError(httpStatus.BAD_REQUEST, "Deal is only available for dinner (17:00 - 22:00)");
                }
            }
        }

        // Check max claims per day (using reservations)
        const startOfDay = new Date(reservationDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(reservationDate);
        endOfDay.setHours(23, 59, 59, 999);

        const currentClaims = await ReservationModel.countDocuments({
            dealId: deal._id,
            reservationDate: { $gte: startOfDay, $lte: endOfDay },
        });

        if (currentClaims >= deal.maxClaimsPerDay) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Deal has reached maximum claims for today");
        }

        // Check if user already claimed this deal today (using reservations)
        const userClaimedToday = await ReservationModel.exists({
            dealId: deal._id,
            userId: new Types.ObjectId(userId),
            reservationDate: { $gte: startOfDay, $lte: endOfDay },
        });

        if (userClaimedToday) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You have already claimed this deal today");
        }

        // Check if user already used this deal in the last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const lastReservation = await ReservationModel.findOne({
            dealId: deal._id,
            userId: new Types.ObjectId(userId),
            status: { $ne: ReservationStatus.CANCELLED },
            reservationDate: { $gte: threeMonthsAgo },
        }).sort({ reservationDate: -1 });

        if (lastReservation) {
            const availableDate = new Date(lastReservation.reservationDate);
            availableDate.setMonth(availableDate.getMonth() + 3);

            const formattedDate = availableDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });

            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `You cannot use this deal again until ${formattedDate}.`
            );
        }
    }

    const reservationData = { ...data, userId };
    const reservation = await ReservationModel.create(reservationData);

    // Remove from saved deals if a deal was associated with the reservation
    if (data.dealId) {
        await SavedDealModel.deleteOne({
            userId: new Types.ObjectId(userId),
            dealId: new Types.ObjectId(data.dealId as any),
        });
    }

    await reservation.populate("restaurantId userId dealId");

    // Broadcast real-time stats update
    if (reservation.restaurantId) {
        dashboardServices.broadcastRestaurantStats(reservation.restaurantId.toString()).catch(console.error);
    }

    return reservation;
};

const getAllReservations = async (user: { _id: string; role: string; restaurantId?: any }, filters: any = {}) => {
    let query: any = {};

    if (user.role === "RESTAURANT_OWNER" || user.role === "STAFF") {
        let restaurantId = user.restaurantId;
        if (!restaurantId && user.role === "RESTAURANT_OWNER") {
            const restaurant = await restaurantServices.getRestaurantByOwner(user._id);
            if (restaurant) {
                restaurantId = restaurant._id;
            }
        }
        if (!restaurantId) {
            throw new ApiError(httpStatus.FORBIDDEN, "User is not associated with any restaurant");
        }
        query.restaurantId = restaurantId;
    } else if (filters.restaurantId) {
        query.restaurantId = filters.restaurantId;
    }
    if (filters.userId) {
        query.userId = filters.userId;
    }
    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.reservationDate) {
        const startOfDay = new Date(filters.reservationDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.reservationDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.reservationDate = {
            $gte: startOfDay,
            $lte: endOfDay,
        };
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
        ReservationModel.find(query)
            .populate("restaurantId", "restaurantName restaurantImage restaurantAddress restaurantType cuisineType")
            .populate("userId", "name email phone profileImage")
            .populate("dealId")
            .sort({ reservationDate: 1, reservationTime: 1 })
            .skip(skip)
            .limit(limit),
        ReservationModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: reservations,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

const getReservationById = async (id: string) => {
    const reservation = await ReservationModel.findById(id)
        .populate("restaurantId", "restaurantName restaurantImage restaurantAddress restaurantType cuisineType")
        .populate("userId", "name email phone profileImage")
        .populate("dealId");
    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found");

    const review = await ReviewModel.exists({ reservationId: reservation._id, isDeleted: false });
    const reservationObj = reservation.toObject() as any;
    reservationObj.isReviewed = !!review;

    return reservationObj;
};

const getMyReservations = async (userId: string, filters: any = {}) => {
    let query: any = { userId };

    if (filters.status) {
        query.status = filters.status;
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
        ReservationModel.find(query)
            .populate("restaurantId", "restaurantName restaurantImage restaurantType cuisineType")
            .populate("dealId")
            .sort({ reservationDate: -1, reservationTime: -1 })
            .skip(skip)
            .limit(limit),
        ReservationModel.countDocuments(query),
    ]);

    // Attach isReviewed flag to each reservation
    const reservationIds = reservations.map((r) => r._id);
    const reviews = await ReviewModel.find({ reservationId: { $in: reservationIds }, isDeleted: false }).select("reservationId");
    const reviewedIds = new Set(reviews.map((r) => r.reservationId?.toString()));

    const formattedReservations = reservations.map((r) => {
        const obj = r.toObject() as any;
        obj.isReviewed = reviewedIds.has(r._id.toString());
        return obj;
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: formattedReservations,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

const updateReservation = async (id: string, data: Partial<IReservation>, userId: string) => {
    if (data.reservationDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservationDate = new Date(data.reservationDate as Date);
        reservationDate.setHours(0, 0, 0, 0);

        if (reservationDate < today) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Reservation date can't be in the past");
        }
    }

    const reservation = await ReservationModel.findOneAndUpdate({ _id: id, userId }, { $set: data }, { returnDocument: 'after', runValidators: true }).populate("restaurantId userId");

    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found or not authorized");

    // Broadcast real-time stats update
    if (reservation.restaurantId) {
        dashboardServices.broadcastRestaurantStats(reservation.restaurantId.toString()).catch(console.error);
    }

    return reservation;
};

const updateReservationStatus = async (id: string, status: ReservationStatus, user: { _id: string; role: string; restaurantId?: any }) => {
    let query: any = { _id: id };

    if (user.role === "RESTAURANT_OWNER" || user.role === "STAFF") {
        let restaurantId = user.restaurantId;
        if (!restaurantId && user.role === "RESTAURANT_OWNER") {
            const restaurant = await restaurantServices.getRestaurantByOwner(user._id);
            if (restaurant) {
                restaurantId = restaurant._id;
            }
        }
        if (!restaurantId) {
            throw new ApiError(httpStatus.FORBIDDEN, "User is not associated with any restaurant");
        }
        query.restaurantId = restaurantId;
    }

    const reservation = await ReservationModel.findOneAndUpdate(query, { $set: { status } }, { returnDocument: 'after', runValidators: true }).populate("restaurantId userId");

    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found or not authorized");

    // Broadcast real-time stats update
    if (reservation.restaurantId) {
        dashboardServices.broadcastRestaurantStats(reservation.restaurantId.toString()).catch(console.error);
    }

    return reservation;
};

const deleteReservation = async (id: string, userId: string) => {
    const reservation = await ReservationModel.findOneAndDelete({ _id: id, userId });
    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found or not authorized");

    // Broadcast real-time stats update
    if (reservation.restaurantId) {
        dashboardServices.broadcastRestaurantStats(reservation.restaurantId.toString()).catch(console.error);
    }

    return { message: "Reservation cancelled successfully" };
};

const getReservationStats = async (user: { _id: string; role: string; restaurantId?: any }, queryParams: any) => {
    let restaurantId = queryParams.restaurantId;

    if (user.role === "RESTAURANT_OWNER" || user.role === "STAFF" || user.role === "MANAGER") {
        restaurantId = user.restaurantId;
        if (!restaurantId && user.role === "RESTAURANT_OWNER") {
            const restaurant = await restaurantServices.getRestaurantByOwner(user._id);
            if (restaurant) {
                restaurantId = restaurant._id;
            }
        }
        if (!restaurantId) {
            throw new ApiError(httpStatus.FORBIDDEN, "User is not associated with any restaurant");
        }
        restaurantId = restaurantId.toString();
    }

    if (!restaurantId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Restaurant ID is required");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const matchQuery: any = {
        restaurantId: new Types.ObjectId(restaurantId),
        reservationDate: { $gte: startOfDay, $lte: endOfDay },
    };

    // 1. Total Bookings Today (excluding cancelled)
    const totalBookingsToday = await ReservationModel.countDocuments({
        ...matchQuery,
        status: { $ne: ReservationStatus.CANCELLED },
    });

    // 2. Total Guests Expected (sum partySize excluding cancelled)
    const guestsExpectedResult = await ReservationModel.aggregate([
        {
            $match: {
                ...matchQuery,
                status: { $ne: ReservationStatus.CANCELLED },
            },
        },
        {
            $group: {
                _id: null,
                totalGuests: { $sum: "$partySize" },
            },
        },
    ]);
    const totalGuestsExpected = guestsExpectedResult[0]?.totalGuests || 0;

    // 3. Guests Served Today (sum partySize for COMPLETED status)
    const guestsServedResult = await ReservationModel.aggregate([
        {
            $match: {
                ...matchQuery,
                status: ReservationStatus.COMPLETED,
            },
        },
        {
            $group: {
                _id: null,
                totalServed: { $sum: "$partySize" },
            },
        },
    ]);
    const guestsServedToday = guestsServedResult[0]?.totalServed || 0;

    // 4. Pending Arrivals (count UPCOMING status)
    const pendingArrivals = await ReservationModel.countDocuments({
        ...matchQuery,
        status: ReservationStatus.UPCOMING,
    });

    return {
        totalBookingsToday,
        totalGuestsExpected,
        guestsServedToday,
        pendingArrivals,
    };
};

const getOwnerStats = async (user: { _id: string; role: string; restaurantId?: any }) => {
    let restaurantId = user.restaurantId;

    if (!restaurantId && user.role === "RESTAURANT_OWNER") {
        const restaurant = await restaurantServices.getRestaurantByOwner(user._id);
        if (restaurant) {
            restaurantId = restaurant._id;
        }
    }

    if (!restaurantId) {
        throw new ApiError(httpStatus.FORBIDDEN, "User is not associated with any restaurant");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const matchQuery: any = {
        restaurantId: new Types.ObjectId(restaurantId),
        reservationDate: { $gte: startOfDay, $lte: endOfDay },
    };

    // 1. Total Bookings Today (excluding cancelled)
    const totalBookingsToday = await ReservationModel.countDocuments({
        ...matchQuery,
        status: { $ne: ReservationStatus.CANCELLED },
    });

    // 2. Upcoming Guests (sum partySize for UPCOMING status today)
    const upcomingGuestsResult = await ReservationModel.aggregate([
        {
            $match: {
                ...matchQuery,
                status: ReservationStatus.UPCOMING,
            },
        },
        {
            $group: {
                _id: null,
                totalGuests: { $sum: "$partySize" },
            },
        },
    ]);
    const upcomingGuests = upcomingGuestsResult[0]?.totalGuests || 0;

    // 3. Completed Bookings (count status COMPLETED today)
    const completedBookings = await ReservationModel.countDocuments({
        ...matchQuery,
        status: ReservationStatus.COMPLETED,
    });

    return {
        totalBookingsToday,
        upcomingGuests,
        completedBookings,
    };
};

const getWeeklyBookings = async (queryParams: any) => {
    let restaurantId = queryParams.restaurantId;

    // 1. Calculate stats for the last 7 days (rolling trend)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const query: any = {
        reservationDate: { $gte: startDate, $lte: endDate },
        status: { $ne: ReservationStatus.CANCELLED },
    };

    if (restaurantId) {
        query.restaurantId = new Types.ObjectId(restaurantId);
    }

    const reservations = await ReservationModel.find(query).select("reservationDate").lean();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const rollingWeekData: { day: string; date: string; count: number }[] = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayName = dayNames[date.getDay()];
        const dateStr = date.toISOString().split("T")[0];
        rollingWeekData.push({
            day: dayName,
            date: dateStr,
            count: 0,
        });
    }

    for (const res of reservations) {
        const resDate = new Date(res.reservationDate);
        const resDateStr = resDate.toISOString().split("T")[0];
        const dayEntry = rollingWeekData.find((d) => d.date === resDateStr);
        if (dayEntry) {
            dayEntry.count++;
        }
    }

    // 2. Calculate stats for the current calendar week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const mondayOfCurrentWeek = new Date(today);
    mondayOfCurrentWeek.setDate(today.getDate() + distanceToMonday);
    mondayOfCurrentWeek.setHours(0, 0, 0, 0);

    const sundayOfCurrentWeek = new Date(mondayOfCurrentWeek);
    sundayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);
    sundayOfCurrentWeek.setHours(23, 59, 59, 999);

    const currentWeekQuery: any = {
        reservationDate: { $gte: mondayOfCurrentWeek, $lte: sundayOfCurrentWeek },
        status: { $ne: ReservationStatus.CANCELLED },
    };

    if (restaurantId) {
        currentWeekQuery.restaurantId = new Types.ObjectId(restaurantId);
    }

    const currentWeekReservations = await ReservationModel.find(currentWeekQuery).select("reservationDate").lean();

    const fixedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const currentWeekData = fixedDays.map((day, index) => {
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
        const dayEntry = currentWeekData.find((d) => d.date === resDateStr);
        if (dayEntry) {
            dayEntry.count++;
        }
    }

    return {
        rollingWeek: rollingWeekData,
        currentWeek: currentWeekData,
    };
};

export const reservationServices = {
    createReservation,
    getAllReservations,
    getReservationById,
    getMyReservations,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    getReservationStats,
    getOwnerStats,
    getWeeklyBookings,
};

import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ReservationModel } from "./reservation.model";
import { IReservation, ReservationStatus } from "./reservation.interface";
import { DealModel } from "../deal/deal.model";
import { DayOfWeek } from "../deal/deal.interface";
import { restaurantServices } from "../restaurant/restaurant.services";
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

        // Check day of week matches and time falls within hours
        const rawReservationDate = new Date(data.reservationDate as Date);
        const reservationDay = rawReservationDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toUpperCase() as DayOfWeek;
        const matchingHour = deal.resturantHours?.find((h) => h.day === reservationDay);

        const formatDay = (day: string) => day.charAt(0) + day.slice(1).toLowerCase();

        if (!matchingHour) {
            const availableDays = deal.resturantHours?.map((h) => `${formatDay(h.day)} (${h.start || "00:00"} - ${h.end || "23:59"})`).join(", ") || "";
            throw new ApiError(httpStatus.BAD_REQUEST, `Deal is only available on ${availableDays}`);
        }

        const reservationTime = data.reservationTime as string;
        const startTime = matchingHour.start || "00:00";
        const endTime = matchingHour.end || "23:59";

        if (reservationTime < startTime || reservationTime > endTime) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Deal is only available between ${startTime} and ${endTime} on ${formatDay(reservationDay)}`);
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
            status: { $nin: [ReservationStatus.CANCELLED, ReservationStatus.EXPIRED] },
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

            throw new ApiError(httpStatus.BAD_REQUEST, `You cannot use this deal again until ${formattedDate}.`);
        }
    }

    // Check if the user already has a reservation with ARRIVED status for this specific deal
    const existingArrivedReservation = await ReservationModel.findOne({
        userId: new Types.ObjectId(userId),
        dealId: new Types.ObjectId(data.dealId as any),
        status: ReservationStatus.ARRIVED,
    });

    if (existingArrivedReservation) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You are already arrived in resturant please you can't use this deal again.");
    }

    const reservationData = { ...data, userId };
    const reservation = await ReservationModel.create(reservationData);

    // Cancel any other UPCOMING reservations for this user and this specific deal
    await ReservationModel.updateMany(
        {
            userId: new Types.ObjectId(userId),
            dealId: new Types.ObjectId(data.dealId as any),
            status: ReservationStatus.UPCOMING,
            _id: { $ne: reservation._id },
        },
        {
            $set: { status: ReservationStatus.CANCELLED },
        },
    );

    // Mark saved deal as used if a deal was associated with the reservation
    // if (data.dealId) {
    //     await SavedDealModel.updateOne(
    //         {
    //             userId: new Types.ObjectId(userId),
    //             dealId: new Types.ObjectId(data.dealId as any),
    //         },
    //         {
    //             $set: { isUsed: true },
    //         },
    //     );
    // }

    await reservation.populate("restaurantId userId dealId");

    // Broadcast real-time stats update
    if (reservation.restaurantId) {
        const restaurantId = (reservation.restaurantId as any)._id ? (reservation.restaurantId as any)._id.toString() : reservation.restaurantId.toString();
        dashboardServices.broadcastRestaurantStats(restaurantId).catch(console.error);
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
        ReservationModel.find(query).populate("restaurantId", "restaurantName restaurantImage restaurantAddress restaurantType cuisineType").populate("userId", "name email phone profileImage").populate("dealId").sort({ reservationDate: 1, reservationTime: 1 }).skip(skip).limit(limit),
        ReservationModel.countDocuments(query),
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
    const reservation = await ReservationModel.findById(id).populate("restaurantId", "restaurantName restaurantImage restaurantAddress restaurantType cuisineType").populate("userId", "name email phone profileImage").populate("dealId");
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
        ReservationModel.find(query).populate("restaurantId", "restaurantName restaurantImage restaurantAddress restaurantType cuisineType").populate("dealId").sort({ reservationDate: -1, reservationTime: -1 }).skip(skip).limit(limit),
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

    const reservation = await ReservationModel.findOneAndUpdate({ _id: id, userId }, { $set: data }, { returnDocument: "after", runValidators: true }).populate("restaurantId userId");

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

    const reservation = await ReservationModel.findOneAndUpdate(query, { $set: { status } }, { returnDocument: "after", runValidators: true }).populate("restaurantId userId");

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

const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
        const dateStr = formatLocalDate(date);
        rollingWeekData.push({
            day: dayName,
            date: dateStr,
            count: 0,
        });
    }

    for (const res of reservations) {
        const resDate = new Date(res.reservationDate);
        const resDateStr = formatLocalDate(resDate);
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
        const dateStr = formatLocalDate(date);
        return {
            day,
            date: dateStr,
            count: 0,
        };
    });

    for (const res of currentWeekReservations) {
        const resDate = new Date(res.reservationDate);
        const resDateStr = formatLocalDate(resDate);
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

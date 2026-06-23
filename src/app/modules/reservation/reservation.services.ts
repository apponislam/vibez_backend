import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ReservationModel } from "./reservation.model";
import { IReservation, ReservationStatus } from "./reservation.interface";
import { DealModel } from "../deal/deal.model";
import { DayOfWeek, MealTimeType } from "../deal/deal.interface";
import { restaurantServices } from "../restaurant/restaurant.services";

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
    }

    const reservationData = { ...data, userId };
    const reservation = await ReservationModel.create(reservationData);
    await reservation.populate("restaurantId userId dealId");
    return reservation;
};

const getAllReservations = async (filters: any = {}) => {
    let query: any = {};

    if (filters.restaurantId) {
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

    const [reservations, total] = await Promise.all([ReservationModel.find(query).populate("restaurantId userId dealId").sort({ reservationDate: 1, reservationTime: 1 }).skip(skip).limit(limit), ReservationModel.countDocuments(query)]);

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
    const reservation = await ReservationModel.findById(id).populate("restaurantId userId dealId");
    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found");
    return reservation;
};

const getMyReservations = async (userId: string, filters: any = {}) => {
    let query: any = { userId };

    if (filters.status) {
        query.status = filters.status;
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([ReservationModel.find(query).populate("restaurantId dealId").sort({ reservationDate: -1, reservationTime: -1 }).skip(skip).limit(limit), ReservationModel.countDocuments(query)]);

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

    const reservation = await ReservationModel.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true, runValidators: true }).populate("restaurantId userId");

    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found or not authorized");
    return reservation;
};

const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    const reservation = await ReservationModel.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true }).populate("restaurantId userId");

    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found");
    return reservation;
};

const deleteReservation = async (id: string, userId: string) => {
    const reservation = await ReservationModel.findOneAndDelete({ _id: id, userId });
    if (!reservation) throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found or not authorized");
    return { message: "Reservation cancelled successfully" };
};

const getReservationStats = async (user: { _id: string; role: string }, queryParams: any) => {
    let restaurantId = queryParams.restaurantId;

    if (user.role === "RESTAURANT_OWNER" || user.role === "MANAGER") {
        const restaurant = await restaurantServices.getRestaurantByOwner(user._id);
        if (!restaurant) {
            throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found for this user");
        }
        restaurantId = restaurant._id.toString();
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

export const reservationServices = {
    createReservation,
    getAllReservations,
    getReservationById,
    getMyReservations,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    getReservationStats,
};

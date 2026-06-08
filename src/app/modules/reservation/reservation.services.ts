import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ReservationModel } from "./reservation.model";
import { IReservation, ReservationStatus } from "./reservation.interface";

const createReservation = async (data: Partial<IReservation>, userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservationDate = new Date(data.reservationDate as Date);
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Reservation date can't be in the past");
    }

    const reservationData = { ...data, userId };
    const reservation = await ReservationModel.create(reservationData);
    await reservation.populate("restaurantId userId");
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

    const [reservations, total] = await Promise.all([ReservationModel.find(query).populate("restaurantId userId").sort({ reservationDate: 1, reservationTime: 1 }).skip(skip).limit(limit), ReservationModel.countDocuments(query)]);

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
    const reservation = await ReservationModel.findById(id).populate("restaurantId userId");
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

    const [reservations, total] = await Promise.all([ReservationModel.find(query).populate("restaurantId").sort({ reservationDate: -1, reservationTime: -1 }).skip(skip).limit(limit), ReservationModel.countDocuments(query)]);

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

export const reservationServices = {
    createReservation,
    getAllReservations,
    getReservationById,
    getMyReservations,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
};

import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { reservationServices } from "./reservation.services";
import { ReservationStatus } from "./reservation.interface";

const createReservation = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.createReservation(req.body, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Reservation created successfully",
        data: result,
    });
});

const getAllReservations = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.getAllReservations(req.user as any, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reservations retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getReservationById = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.getReservationById(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reservation retrieved successfully",
        data: result,
    });
});

const getMyReservations = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.getMyReservations(req.user._id as string, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your reservations retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const updateReservation = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.updateReservation(req.params.id as string, req.body, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reservation updated successfully",
        data: result,
    });
});

const updateReservationStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.updateReservationStatus(req.params.id as string, req.body.status as ReservationStatus, req.user as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reservation status updated successfully",
        data: result,
    });
});

const deleteReservation = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.deleteReservation(req.params.id as string, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reservation cancelled successfully",
        data: result,
    });
});

const getReservationStats = catchAsync(async (req: Request, res: Response) => {
    const result = await reservationServices.getReservationStats(req.user as any, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reservation statistics retrieved successfully",
        data: result,
    });
});

export const reservationControllers = {
    createReservation,
    getAllReservations,
    getReservationById,
    getMyReservations,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    getReservationStats,
};

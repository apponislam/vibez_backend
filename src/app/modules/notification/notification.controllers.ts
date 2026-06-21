import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { notificationServices } from "./notification.services";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await notificationServices.getMyNotifications(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications retrieved successfully",
        data: result,
    });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const notificationId = req.params.id as string;
    const result = await notificationServices.markAsRead(userId, notificationId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification marked as read successfully",
        data: result,
    });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await notificationServices.markAllAsRead(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All notifications marked as read successfully",
        data: result,
    });
});

export const notificationControllers = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
};

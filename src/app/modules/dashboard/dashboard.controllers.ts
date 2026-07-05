import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { dashboardServices } from "./dashboard.services";

const getAdminDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getAdminDashboardStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin dashboard stats retrieved successfully",
        data: result,
    });
});

const getAffiliateStats = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getAffiliateStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Affiliate dashboard statistics retrieved successfully",
        data: result,
    });
});

const getRestaurantOwnerDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getRestaurantOwnerDashboardStats(req.user as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant owner dashboard statistics retrieved successfully",
        data: result,
    });
});

const getRestaurantOwnerBookingsPerDay = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getRestaurantOwnerBookingsPerDay(req.user as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant owner bookings per day retrieved successfully",
        data: result,
    });
});

const getRestaurantOwnerOverview = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getRestaurantOwnerOverview(req.user as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant owner dashboard overview retrieved successfully",
        data: result,
    });
});

const getRestaurantOwnerMealTimeStats = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getRestaurantOwnerMealTimeStats(req.user as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant owner meal time statistics (Lunch vs Dinner) retrieved successfully",
        data: result,
    });
});

const getRestaurantOwnerInsights = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardServices.getRestaurantOwnerInsights(req.user as any);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant owner dashboard insights retrieved successfully",
        data: result,
    });
});

export const dashboardControllers = {
    getAdminDashboardStats,
    getAffiliateStats,
    getRestaurantOwnerDashboardStats,
    getRestaurantOwnerBookingsPerDay,
    getRestaurantOwnerOverview,
    getRestaurantOwnerMealTimeStats,
    getRestaurantOwnerInsights,
};

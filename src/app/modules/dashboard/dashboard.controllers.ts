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

export const dashboardControllers = {
    getAdminDashboardStats,
    getAffiliateStats,
};

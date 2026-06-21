import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { userServices } from "./user.services";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getAllUsers(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getUserActivity = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getUserActivity(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User activity retrieved successfully",
        data: result,
    });
});

const updateUserByAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.updateUserByAdmin(req.params.id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User updated successfully",
        data: result,
    });
});

const toggleUserActiveStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.toggleUserActiveStatus(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User active status toggled successfully",
        data: result,
    });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getUserStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User statistics retrieved successfully",
        data: result,
    });
});

const createStaffByOwner = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.user._id as string;
    const result = await userServices.createStaffByOwner(ownerId, req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Staff member created successfully",
        data: result,
    });
});

const getStaffByOwner = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.user._id as string;
    const result = await userServices.getStaffByOwner(ownerId, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Staff members retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

export const userControllers = {
    getAllUsers,
    getUserActivity,
    updateUserByAdmin,
    toggleUserActiveStatus,
    getUserStats,
    createStaffByOwner,
    getStaffByOwner,
};

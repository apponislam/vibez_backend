import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { userServices } from "./user.services";
import ApiError from "../../../errors/ApiError";

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
    let profileImageUrl = undefined;
    if (req.file) {
        profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
    }

    let data = req.body;
    if (req.body.body && typeof req.body.body === "string") {
        try {
            data = JSON.parse(req.body.body);
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON data in body field");
        }
    }

    if (profileImageUrl) {
        data.profileImage = profileImageUrl;
    }

    const ownerId = req.user._id as string;
    const result = await userServices.createStaffByOwner(ownerId, data);
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

const toggleStaffLoginStatus = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.user._id as string;
    const { staffId } = req.params;
    const result = await userServices.toggleStaffLoginStatus(ownerId, staffId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Staff login ${result.enableStaffLogin ? "enabled" : "disabled"} successfully`,
        data: result,
    });
});

const toggleAllStaffLoginStatus = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.user._id as string;
    const { enable } = req.body;
    const result = await userServices.toggleAllStaffLoginStatus(ownerId, enable);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `All staff login ${result.enableStaffLogin ? "enabled" : "disabled"} successfully`,
        data: result,
    });
});

const changeStaffPasswordByOwner = catchAsync(async (req: Request, res: Response) => {
    const callerId = req.user._id as string;
    const callerRole = req.user.role as string;
    const { staffId } = req.params;
    const { password } = req.body;

    if (!password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
    }

    const result = await userServices.changeStaffPasswordByOwner(callerId, callerRole, staffId as string, password);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Staff password changed successfully",
        data: result,
    });
});

const updateStaffDetailsByOwner = catchAsync(async (req: Request, res: Response) => {
    const callerId = req.user._id as string;
    const callerRole = req.user.role as string;
    const { staffId } = req.params;

    let profileImageUrl = undefined;
    if (req.file) {
        profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
    }

    let data = req.body;
    if (req.body.body && typeof req.body.body === "string") {
        try {
            data = JSON.parse(req.body.body);
        } catch (error) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON data in body field");
        }
    }

    if (profileImageUrl) {
        data.profileImage = profileImageUrl;
    }

    const result = await userServices.updateStaffDetailsByOwner(callerId, callerRole, staffId as string, data);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Staff details updated successfully",
        data: result,
    });
});
const getUserActivitySummary = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getUserActivitySummary(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User activity summary retrieved successfully",
        data: result,
    });
});

const getUserReferrals = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getUserReferrals(req.params.id as string, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User referrals retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getUserCommissions = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getUserCommissions(req.params.id as string, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User commissions retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getUserWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getUserWithdrawals(req.params.id as string, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User withdrawals retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getUserSubscriptions = catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.getUserSubscriptions(req.params.id as string, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User subscriptions retrieved successfully",
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
    toggleStaffLoginStatus,
    toggleAllStaffLoginStatus,
    changeStaffPasswordByOwner,
    updateStaffDetailsByOwner,
    getUserActivitySummary,
    getUserReferrals,
    getUserCommissions,
    getUserWithdrawals,
    getUserSubscriptions,
};

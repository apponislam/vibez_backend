import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { withdrawServices } from "./withdraw.services";

const createConnectAccount = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id.toString();
    const result = await withdrawServices.createConnectAccount(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe Connect onboarding link generated successfully",
        data: result,
    });
});

const requestWithdrawal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id.toString();
    const result = await withdrawServices.requestWithdrawal(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Withdrawal request submitted successfully",
        data: result,
    });
});

const approveWithdrawal = catchAsync(async (req: Request, res: Response) => {
    const result = await withdrawServices.approveWithdrawal(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Withdrawal request approved and processed successfully",
        data: result,
    });
});

const rejectWithdrawal = catchAsync(async (req: Request, res: Response) => {
    const { adminFeedback } = req.body;
    const result = await withdrawServices.rejectWithdrawal(req.params.id as string, adminFeedback);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Withdrawal request rejected successfully",
        data: result,
    });
});

const getUserWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id.toString();
    const result = await withdrawServices.getUserWithdrawals(userId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User withdrawals retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getAllWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const result = await withdrawServices.getAllWithdrawals(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All withdrawals retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

export const withdrawControllers = {
    createConnectAccount,
    requestWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
};

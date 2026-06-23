import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { savedDealServices } from "./saved-deal.services";

const toggleSavedDeal = catchAsync(async (req: Request, res: Response) => {
    const { dealId } = req.body;
    const result = await savedDealServices.toggleSavedDeal(req.user._id, dealId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const getUserSavedDeals = catchAsync(async (req: Request, res: Response) => {
    const result = await savedDealServices.getUserSavedDeals(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Saved deals retrieved successfully",
        data: result,
    });
});

const getSavedDealsCount = catchAsync(async (req: Request, res: Response) => {
    const result = await savedDealServices.getSavedDealsCount(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Saved deals count retrieved successfully",
        data: result,
    });
});

export const savedDealControllers = {
    toggleSavedDeal,
    getUserSavedDeals,
    getSavedDealsCount,
};

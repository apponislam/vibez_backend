import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { savedDealServices } from "./saved-deal.services";

const saveDeal = catchAsync(async (req: Request, res: Response) => {
    const { dealId } = req.body;
    const result = await savedDealServices.saveDeal(req.user._id, dealId as string);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Deal saved successfully",
        data: result,
    });
});

const unsaveDeal = catchAsync(async (req: Request, res: Response) => {
    const { dealId } = req.params;
    await savedDealServices.unsaveDeal(req.user._id, dealId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Deal removed from saved successfully",
        data: null,
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

const checkIsSaved = catchAsync(async (req: Request, res: Response) => {
    const { dealId } = req.params;
    const result = await savedDealServices.checkIsSaved(req.user._id, dealId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Saved status checked successfully",
        data: result,
    });
});

export const savedDealControllers = {
    saveDeal,
    unsaveDeal,
    getUserSavedDeals,
    checkIsSaved,
};

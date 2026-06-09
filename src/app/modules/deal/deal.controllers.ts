import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { dealServices } from "./deal.services";

const createDeal = catchAsync(async (req: Request, res: Response) => {
    const result = await dealServices.createDeal(req.user._id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Deal created successfully",
        data: result,
    });
});

const getAllDeals = catchAsync(async (req: Request, res: Response) => {
    const result = await dealServices.getAllDeals(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Deals retrieved successfully",
        data: result,
    });
});

const getActiveDeals = catchAsync(async (req: Request, res: Response) => {
    const restaurantId = req.query.restaurantId as string | undefined;
    const result = await dealServices.getActiveDeals(restaurantId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Deals retrieved successfully",
        data: result,
    });
});

const getDealById = catchAsync(async (req: Request, res: Response) => {
    const result = await dealServices.getDealById(req.params.dealId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Deal retrieved successfully",
        data: result,
    });
});

const updateDeal = catchAsync(async (req: Request, res: Response) => {
    const result = await dealServices.updateDeal(req.params.dealId as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Deal updated successfully",
        data: result,
    });
});

const toggleDealStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await dealServices.toggleDealStatus(req.params.dealId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Deal ${result.isActive ? "activated" : "deactivated"} successfully`,
        data: result,
    });
});

const deleteDeal = catchAsync(async (req: Request, res: Response) => {
    await dealServices.deleteDeal(req.params.dealId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Deal deleted successfully",
        data: null,
    });
});

export const dealControllers = {
    createDeal,
    getAllDeals,
    getActiveDeals,
    getDealById,
    updateDeal,
    toggleDealStatus,
    deleteDeal,
};

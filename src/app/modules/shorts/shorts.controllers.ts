import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { shortsServices } from "./shorts.services";

const uploadShorts = catchAsync(async (req: Request, res: Response) => {
    const result = await shortsServices.uploadShorts(req.user._id, req.body.shortUrl);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant short uploaded successfully",
        data: result,
    });
});

const getShortsByRestaurant = catchAsync(async (req: Request, res: Response) => {
    const result = await shortsServices.getShortsByRestaurant(req.params.restaurantId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant short retrieved successfully",
        data: result,
    });
});

const getMyShorts = catchAsync(async (req: Request, res: Response) => {
    const result = await shortsServices.getMyShorts(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant short retrieved successfully",
        data: result,
    });
});

const deleteShorts = catchAsync(async (req: Request, res: Response) => {
    await shortsServices.deleteShorts(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant short deleted successfully",
        data: null,
    });
});

const getRandomShorts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const result = await shortsServices.getRandomShorts(req.query, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Random shorts retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

export const shortsControllers = {
    uploadShorts,
    getShortsByRestaurant,
    getMyShorts,
    deleteShorts,
    getRandomShorts,
};

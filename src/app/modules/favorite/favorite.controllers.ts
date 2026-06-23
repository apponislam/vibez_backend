import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { favoriteServices } from "./favorite.services";

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const { restaurantId } = req.body;
    const result = await favoriteServices.toggleFavorite(req.user._id, restaurantId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const getUserFavorites = catchAsync(async (req: Request, res: Response) => {
    const result = await favoriteServices.getUserFavorites(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Favorites retrieved successfully",
        data: result,
    });
});

export const favoriteControllers = {
    toggleFavorite,
    getUserFavorites,
};

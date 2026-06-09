import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { favoriteServices } from "./favorite.services";

const addFavorite = catchAsync(async (req: Request, res: Response) => {
    const { restaurantId } = req.body;
    const result = await favoriteServices.addFavorite(req.user._id, restaurantId as string);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Restaurant added to favorites successfully",
        data: result,
    });
});

const removeFavorite = catchAsync(async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    await favoriteServices.removeFavorite(req.user._id, restaurantId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant removed from favorites successfully",
        data: null,
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

const checkIsFavorite = catchAsync(async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    const result = await favoriteServices.checkIsFavorite(req.user._id, restaurantId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Favorite status checked successfully",
        data: result,
    });
});

export const favoriteControllers = {
    addFavorite,
    removeFavorite,
    getUserFavorites,
    checkIsFavorite,
};

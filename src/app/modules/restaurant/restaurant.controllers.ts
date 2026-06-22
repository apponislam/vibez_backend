import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { restaurantServices } from "./restaurant.services";

const parseRequestBody = (req: Request): any => {
    let data: any = {};
    if (req.body.body && typeof req.body.body === "string") {
        try {
            data = JSON.parse(req.body.body);
        } catch (error) {
            try {
                data = JSON.parse(`{${req.body.body}}`);
            } catch (innerError) {
                data = req.body;
            }
        }
    } else {
        data = req.body;
    }

    if (req.body.restaurantImage) {
        data.restaurantImage = req.body.restaurantImage;
    }
    return data;
};

const createRestaurant = catchAsync(async (req: Request, res: Response) => {
    const data = parseRequestBody(req);
    const result = await restaurantServices.createRestaurant(data, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Restaurant created successfully",
        data: result,
    });
});

const getAllRestaurants = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const result = await restaurantServices.getAllRestaurants(req.query, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurants retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getRestaurantById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id?.toString();
    const result = await restaurantServices.getRestaurantById(req.params.id as string, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant retrieved successfully",
        data: result,
    });
});

const getMyRestaurant = catchAsync(async (req: Request, res: Response) => {
    const result = await restaurantServices.getRestaurantByOwner(req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant retrieved successfully",
        data: result,
    });
});

const updateRestaurant = catchAsync(async (req: Request, res: Response) => {
    const data = parseRequestBody(req);
    const result = await restaurantServices.updateRestaurant(req.params.id as string, data, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant updated successfully",
        data: result,
    });
});

const deleteRestaurant = catchAsync(async (req: Request, res: Response) => {
    const result = await restaurantServices.deleteRestaurant(req.params.id as string, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant deleted successfully",
        data: result,
    });
});

const approveRestaurant = catchAsync(async (req: Request, res: Response) => {
    const restaurantId = req.params.id as string;
    const approvedBy = req.user._id;
    const result = await restaurantServices.approveRestaurant(restaurantId, approvedBy);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant approved successfully",
        data: result,
    });
});

const revokeRestaurantApproval = catchAsync(async (req: Request, res: Response) => {
    const restaurantId = req.params.id as string;
    const result = await restaurantServices.revokeRestaurantApproval(restaurantId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurant approval revoked successfully",
        data: result,
    });
});

const getAllRestaurantsForAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await restaurantServices.getAllRestaurantsForAdmin(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurants retrieved successfully for admin",
        data: result.data,
        meta: result.meta,
    });
});

export const restaurantControllers = {
    createRestaurant,
    getAllRestaurants,
    getAllRestaurantsForAdmin,
    getRestaurantById,
    getMyRestaurant,
    updateRestaurant,
    deleteRestaurant,
    approveRestaurant,
    revokeRestaurantApproval,
};

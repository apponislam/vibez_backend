import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { restaurantServices } from "./restaurant.services";

const createRestaurant = catchAsync(async (req: Request, res: Response) => {
    const result = await restaurantServices.createRestaurant(req.body, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Restaurant created successfully",
        data: result,
    });
});

const getAllRestaurants = catchAsync(async (req: Request, res: Response) => {
    const result = await restaurantServices.getAllRestaurants(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Restaurants retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getRestaurantById = catchAsync(async (req: Request, res: Response) => {
    const result = await restaurantServices.getRestaurantById(req.params.id as string);
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
    const result = await restaurantServices.updateRestaurant(req.params.id as string, req.body, req.user._id as string);
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

export const restaurantControllers = {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    getMyRestaurant,
    updateRestaurant,
    deleteRestaurant,
};

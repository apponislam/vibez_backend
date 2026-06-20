import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { subscriptionServices } from "./subscription.services";

// Subscription Plan Controllers
const createSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionServices.createSubscriptionPlan(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Subscription plan created successfully",
        data: result,
    });
});

const getAllSubscriptionPlans = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionServices.getAllSubscriptionPlans();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plans retrieved successfully",
        data: result,
    });
});

const getSubscriptionPlanById = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionServices.getSubscriptionPlanById(
        req.params.id as string
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plan retrieved successfully",
        data: result,
    });
});

const updateSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionServices.updateSubscriptionPlan(
        req.params.id as string,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plan updated successfully",
        data: result,
    });
});

const deleteSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionServices.deleteSubscriptionPlan(
        req.params.id as string
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plan deleted successfully",
        data: result,
    });
});

const createCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await subscriptionServices.createCoupon(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Coupon created successfully",
        data: result,
    });
});

export const subscriptionControllers = {
    createSubscriptionPlan,
    getAllSubscriptionPlans,
    getSubscriptionPlanById,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    createCoupon,
};

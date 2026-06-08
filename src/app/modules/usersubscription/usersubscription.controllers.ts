import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { userSubscriptionServices } from "./usersubscription.services";
import { stripeServices } from "../stripe/stripe.service";
import { SubscriptionPlanModel } from "../subscription/subscription.model";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
    const { planId, successUrl, cancelUrl } = req.body;
    const userId = req.user._id as string;

    const plan = await SubscriptionPlanModel.findById(planId);
    if (!plan) {
        throw new Error("Subscription plan not found");
    }
    if (!plan.stripePriceId) {
        throw new Error("Subscription plan has no Stripe price ID");
    }

    const session = await stripeServices.createCheckoutSession(
        plan.stripePriceId,
        successUrl,
        cancelUrl,
        req.user.email,
        { userId }, // Pass userId as metadata
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Checkout session created successfully",
        data: { sessionId: session.id, url: session.url },
    });
});

const createUserSubscription = catchAsync(async (req: Request, res: Response) => {
    const result = await userSubscriptionServices.createUserSubscription(req.body, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User subscription created successfully",
        data: result,
    });
});

const getUserSubscriptions = catchAsync(async (req: Request, res: Response) => {
    const result = await userSubscriptionServices.getUserSubscriptions(req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User subscriptions retrieved successfully",
        data: result,
    });
});

const getUserSubscriptionById = catchAsync(async (req: Request, res: Response) => {
    const result = await userSubscriptionServices.getUserSubscriptionById(req.params.id as string, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User subscription retrieved successfully",
        data: result,
    });
});

const cancelUserSubscription = catchAsync(async (req: Request, res: Response) => {
    const result = await userSubscriptionServices.cancelUserSubscription(req.params.id as string, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User subscription cancelled successfully",
        data: result,
    });
});

const resumeUserSubscription = catchAsync(async (req: Request, res: Response) => {
    const result = await userSubscriptionServices.resumeUserSubscription(req.params.id as string, req.user._id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User subscription resumed successfully",
        data: result,
    });
});

export const userSubscriptionControllers = {
    createCheckoutSession,
    createUserSubscription,
    getUserSubscriptions,
    getUserSubscriptionById,
    cancelUserSubscription,
    resumeUserSubscription,
};

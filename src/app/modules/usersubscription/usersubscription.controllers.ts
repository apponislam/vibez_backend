import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { userSubscriptionServices } from "./usersubscription.services";
import { stripeServices } from "../stripe/stripe.service";
import { SubscriptionPlanModel } from "../subscription/subscription.model";
import { CouponModel } from "../coupon/coupon.model";
import config from "../../config";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
    const { planId, subscriptionPlanId, successUrl, cancelUrl, coupon, uiMode } = req.body;
    const referralCode = req.body.referralCode || req.body.referredByCode || req.body.reffalCode || req.body.referral;
    const targetPlanId = planId || subscriptionPlanId;
    const userId = req.user._id.toString();

    const plan = await SubscriptionPlanModel.findById(targetPlanId);
    if (!plan) {
        throw new Error("Subscription plan not found");
    }
    if (!plan.stripePriceId) {
        throw new Error("Subscription plan has no Stripe price ID");
    }

    if (coupon) {
        const dbCoupon = await CouponModel.findOne({ couponId: coupon });
        if (!dbCoupon) {
            throw new Error("Invalid coupon code");
        }
        if (!dbCoupon.isActive) {
            throw new Error("This coupon is no longer active");
        }
    }

    const finalSuccessUrl = successUrl || `${config.client_url}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${config.client_url}/subscription/cancel`;

    let sessionData: any = {};

    if (uiMode === "embedded") {
        const paymentSheet = await stripeServices.createSubscriptionPaymentSheet(
            plan.stripePriceId,
            req.user.email,
            { userId, ...(coupon && { coupon }), ...(referralCode && { referralCode }) },
            plan.isFreeTrial ? plan.freeTrialDays : undefined,
            coupon
        );
        sessionData = {
            sessionId: paymentSheet.subscriptionId,
            url: null,
            clientSecret: paymentSheet.clientSecret,
            customerId: paymentSheet.customerId,
            ephemeralKeySecret: paymentSheet.ephemeralKeySecret,
        };
    } else {
        const session = await stripeServices.createCheckoutSession(
            plan.stripePriceId,
            finalSuccessUrl,
            finalCancelUrl,
            req.user.email,
            { userId, ...(coupon && { coupon }), ...(referralCode && { referralCode }) }, // Pass userId, coupon, and referralCode as metadata
            plan.isFreeTrial ? plan.freeTrialDays : undefined,
            coupon,
            uiMode,
        );
        sessionData = {
            sessionId: session.id,
            url: session.url,
            clientSecret: session.client_secret,
        };
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Checkout session created successfully",
        data: sessionData,
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

const getAllSubscriptionsByAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await userSubscriptionServices.getAllSubscriptionsByAdmin(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All user subscriptions retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getRevenueBreakdown = catchAsync(async (req: Request, res: Response) => {
    const result = await userSubscriptionServices.getRevenueBreakdown();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Revenue breakdown retrieved successfully",
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
    getAllSubscriptionsByAdmin,
    getRevenueBreakdown,
};

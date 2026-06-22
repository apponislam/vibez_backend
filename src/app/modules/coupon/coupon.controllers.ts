import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { couponServices } from "./coupon.services";

const createCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await couponServices.createCoupon(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Coupon created successfully and saved in database",
        data: result,
    });
});

const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
    const result = await couponServices.getAllCoupons();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Coupons retrieved successfully",
        data: result,
    });
});

const getCouponById = catchAsync(async (req: Request, res: Response) => {
    const result = await couponServices.getCouponById(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Coupon retrieved successfully",
        data: result,
    });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await couponServices.deleteCoupon(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Coupon deleted successfully from Stripe and database",
        data: result,
    });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await couponServices.updateCoupon(req.params.id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Coupon updated successfully",
        data: result,
    });
});

const verifyReferralCode = catchAsync(async (req: Request, res: Response) => {
    const referralCode = req.body.referralCode || req.query.referralCode || req.body.code || req.query.code;
    const result = await couponServices.verifyReferralCodeAndGetCoupon(referralCode);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Referral code verified and default coupon retrieved successfully",
        data: result,
    });
});

export const couponControllers = {
    createCoupon,
    getAllCoupons,
    getCouponById,
    deleteCoupon,
    updateCoupon,
    verifyReferralCode,
};

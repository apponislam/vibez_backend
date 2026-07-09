import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { CouponModel } from "./coupon.model";
import { ICoupon } from "./coupon.interface";
import { stripeServices } from "../stripe/stripe.service";

import { UserModel } from "../auth/auth.model";

// Create coupon on Stripe and save locally
const createCoupon = async (data: Partial<ICoupon>) => {
    if (!data.couponId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "couponId (code) is required");
    }

    // 1. Create Coupon in Stripe
    try {
        await stripeServices.createCoupon(data.couponId, data.percentOff, data.amountOff, "chf", data.duration, data.durationInMonths);
    } catch (error: any) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Failed to create coupon in Stripe: ${error.message}`);
    }

    // If this new coupon is default, disable other default coupons first
    if (data.isDefault) {
        await CouponModel.updateMany({}, { $set: { isDefault: false } });
    }

    // 2. Save Coupon details locally in database
    const localCouponData = {
        couponId: data.couponId,
        name: data.name || `${data.couponId} Coupon`,
        percentOff: data.percentOff,
        amountOff: data.amountOff,
        currency: "chf",
        duration: data.duration || "forever",
        durationInMonths: data.durationInMonths,
        maxRedemptions: data.maxRedemptions,
        timesRedeemed: 0,
        isDefault: !!data.isDefault,
        isActive: true,
    };

    const coupon = await CouponModel.create(localCouponData);
    return coupon;
};

// Retrieve all coupons from local database
const getAllCoupons = async () => {
    const coupons = await CouponModel.find().sort({ createdAt: -1 });
    return coupons;
};

// Get coupon details by local ID or Stripe couponId
const getCouponById = async (id: string) => {
    const isObjectId = Types.ObjectId.isValid(id);
    const query = isObjectId
        ? { $or: [{ _id: id }, { couponId: id }] }
        : { couponId: id };

    const coupon = await CouponModel.findOne(query);
    if (!coupon) throw new ApiError(httpStatus.NOT_FOUND, "Coupon not found");
    return coupon;
};

// Delete coupon in Stripe and locally
const deleteCoupon = async (id: string) => {
    const coupon = await CouponModel.findById(id);
    if (!coupon) throw new ApiError(httpStatus.NOT_FOUND, "Coupon not found");

    // 1. Delete from Stripe
    try {
        await stripeServices.stripe.coupons.del(coupon.couponId);
    } catch (error: any) {
        // Log the error but proceed with database deletion in case it was already deleted on Stripe dashboard
        console.warn(`Stripe coupon deletion warning: ${error.message}`);
    }

    // 2. Delete locally
    await CouponModel.findByIdAndDelete(id);

    return { message: "Coupon deleted successfully" };
};

const updateCoupon = async (id: string, data: Partial<ICoupon>) => {
    const coupon = await CouponModel.findById(id);
    if (!coupon) throw new ApiError(httpStatus.NOT_FOUND, "Coupon not found");

    // 1. Update in Stripe (only metadata can be updated)
    if (data.name) {
        try {
            await stripeServices.stripe.coupons.update(coupon.couponId, {
                metadata: { name: data.name },
            });
        } catch (error: any) {
            console.warn(`Stripe coupon update warning: ${error.message}`);
        }
    }

    // If updated coupon is set as default, disable other default coupons
    if (data.isDefault) {
        await CouponModel.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
    }

    // 2. Update locally
    const updatedCoupon = await CouponModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true });
    return updatedCoupon;
};

const verifyReferralCodeAndGetCoupon = async (referralCode: string, currentUserId?: string) => {
    if (!referralCode) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Referral code is required");
    }

    // Check if referrer exists
    const referrer = await UserModel.findOne({ referralCode });
    if (!referrer) {
        throw new ApiError(httpStatus.NOT_FOUND, "Invalid referral code");
    }

    // Check if user is trying to refer themselves
    if (currentUserId && referrer._id.toString() === currentUserId.toString()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot use your own referral code");
    }

    // Get active default coupon
    const defaultCoupon = await CouponModel.findOne({ isDefault: true, isActive: true });
    if (!defaultCoupon) {
        throw new ApiError(httpStatus.NOT_FOUND, "Default coupon not configured or inactive");
    }

    return {
        _id: defaultCoupon._id,
        couponId: defaultCoupon.couponId,
        name: defaultCoupon.name,
        percentOff: defaultCoupon.percentOff,
        amountOff: defaultCoupon.amountOff,
        referralCode,
    };
};

export const couponServices = {
    createCoupon,
    getAllCoupons,
    getCouponById,
    deleteCoupon,
    updateCoupon,
    verifyReferralCodeAndGetCoupon,
};

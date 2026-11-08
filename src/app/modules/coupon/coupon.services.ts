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
        selectedPlans: Array.isArray(data.selectedPlans) ? data.selectedPlans : [],
        isDirectUse: !!data.isDirectUse,
        isActive: true,
    };

    const coupon = await CouponModel.create(localCouponData);
    return coupon;
};

// Retrieve all coupons from local database
const getAllCoupons = async () => {
    const coupons = await CouponModel.find().populate("selectedPlans", "name price duration").sort({ createdAt: -1 });
    return coupons;
};

// Get coupon details by local ID or Stripe couponId
const getCouponById = async (id: string) => {
    const isObjectId = Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { couponId: id }] } : { couponId: id };

    const coupon = await CouponModel.findOne(query).populate("selectedPlans", "name price duration");
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

    if (data.isDefault !== undefined) {
        data.isDefault = !!data.isDefault;
    }
    if (data.selectedPlans !== undefined) {
        data.selectedPlans = Array.isArray(data.selectedPlans) ? data.selectedPlans : [];
    }

    // 2. Update locally
    const updatedCoupon = await CouponModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: "after", runValidators: true }).populate("selectedPlans", "name price duration");
    return updatedCoupon;
};

const verifyReferralCodeAndGetCoupon = async (referralCode: string, currentUserId?: string, planId?: string) => {
    if (!referralCode) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Referral code or coupon is required");
    }

    // 1. Check if the code is a Direct Coupon (isDirectUse: true)
    const directCoupon = await CouponModel.findOne({
        couponId: referralCode,
        isActive: true,
        isDirectUse: true,
    });

    if (directCoupon) {
        if (directCoupon.maxRedemptions && directCoupon.timesRedeemed >= directCoupon.maxRedemptions) {
            throw new ApiError(httpStatus.BAD_REQUEST, "This coupon has reached its maximum number of redemptions");
        }

        // If direct coupon has selectedPlans restriction, verify planId
        if (
            planId &&
            directCoupon.selectedPlans &&
            directCoupon.selectedPlans.length > 0 &&
            !directCoupon.selectedPlans.some((id: any) => id.toString() === planId.toString())
        ) {
            throw new ApiError(httpStatus.BAD_REQUEST, "This coupon is not valid for the selected subscription plan");
        }

        return {
            _id: directCoupon._id,
            couponId: directCoupon.couponId,
            name: directCoupon.name,
            percentOff: directCoupon.percentOff,
            amountOff: directCoupon.amountOff,
            isDefault: directCoupon.isDefault,
            selectedPlans: directCoupon.selectedPlans,
        };
    }

    // 2. Otherwise, treat code as an Influencer Referral Code
    if (currentUserId) {
        const currentUser = await UserModel.findById(currentUserId);
        if (!currentUser || !currentUser.isActive || currentUser.isDeleted) {
            throw new ApiError(httpStatus.NOT_FOUND, "Authenticated user account not found or is inactive");
        }
    }

    // Check if referrer exists
    const referrer = await UserModel.findOne({ referralCode, isDeleted: false });
    if (!referrer || !referrer.isActive) {
        throw new ApiError(httpStatus.NOT_FOUND, "The referral code or coupon provided is invalid, inactive, or does not exist");
    }

    // Check if user is trying to refer themselves
    if (currentUserId && referrer._id.toString() === currentUserId.toString()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot use your own referral code");
    }

    // 3. Resolve active default coupon:
    // If planId is provided: first look for default coupon for that specific plan
    let defaultCoupon: any = null;
    if (planId) {
        defaultCoupon = await CouponModel.findOne({
            isDefault: true,
            selectedPlans: planId,
            isActive: true,
        });
    }

    // Fallback: look for a default coupon without plan restrictions (applies to all plans)
    if (!defaultCoupon) {
        defaultCoupon = await CouponModel.findOne({
            isDefault: true,
            $or: [{ selectedPlans: { $size: 0 } }, { selectedPlans: { $exists: false } }],
            isActive: true,
        });
    }

    // Fallback if no global default coupon, check any active default coupon
    if (!defaultCoupon) {
        defaultCoupon = await CouponModel.findOne({
            isDefault: true,
            isActive: true,
        });
    }

    if (!defaultCoupon) {
        throw new ApiError(httpStatus.NOT_FOUND, "Default coupon not configured or inactive");
    }
    if (defaultCoupon.maxRedemptions && defaultCoupon.timesRedeemed >= defaultCoupon.maxRedemptions) {
        throw new ApiError(httpStatus.BAD_REQUEST, "This coupon has reached its maximum number of redemptions");
    }

    return {
        _id: defaultCoupon._id,
        couponId: defaultCoupon.couponId,
        name: defaultCoupon.name,
        percentOff: defaultCoupon.percentOff,
        amountOff: defaultCoupon.amountOff,
        isDefault: defaultCoupon.isDefault,
        selectedPlans: defaultCoupon.selectedPlans,
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

import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PromoCodeModel } from "./promocodes.model";

const createPromoCode = async (data: any) => {
    const promoCode = await PromoCodeModel.create(data);
    return promoCode;
};

const getAllPromoCodes = async (filters: any = {}) => {
    const promoCodes = await PromoCodeModel.find(filters);
    return promoCodes;
};

const getPromoCodeById = async (id: string) => {
    const promoCode = await PromoCodeModel.findById(id);
    if (!promoCode) throw new ApiError(httpStatus.NOT_FOUND, "Promo code not found");
    return promoCode;
};

const getPromoCodeByCode = async (code: string) => {
    const promoCode = await PromoCodeModel.findOne({ code, isActive: true });
    if (!promoCode) throw new ApiError(httpStatus.NOT_FOUND, "Promo code not found or inactive");
    
    const now = new Date();
    if (promoCode.startDate && promoCode.startDate > now) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Promo code not yet active");
    }
    if (promoCode.endDate && promoCode.endDate < now) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Promo code expired");
    }
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Promo code usage limit reached");
    }
    
    return promoCode;
};

const updatePromoCode = async (id: string, data: any) => {
    const promoCode = await PromoCodeModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );
    if (!promoCode) throw new ApiError(httpStatus.NOT_FOUND, "Promo code not found");
    return promoCode;
};

const deletePromoCode = async (id: string) => {
    const promoCode = await PromoCodeModel.findByIdAndDelete(id);
    if (!promoCode) throw new ApiError(httpStatus.NOT_FOUND, "Promo code not found");
    return { message: "Promo code deleted successfully" };
};

const usePromoCode = async (code: string, orderAmount: number) => {
    const promoCode = await getPromoCodeByCode(code);
    
    if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Minimum order amount is ${promoCode.minOrderAmount}`);
    }
    
    let discountAmount = (orderAmount * promoCode.discountPercentage) / 100;
    if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
        discountAmount = promoCode.maxDiscountAmount;
    }
    
    promoCode.usageCount += 1;
    await promoCode.save();
    
    return { discountAmount, promoCode };
};

export const promoCodeServices = {
    createPromoCode,
    getAllPromoCodes,
    getPromoCodeById,
    getPromoCodeByCode,
    updatePromoCode,
    deletePromoCode,
    usePromoCode,
};

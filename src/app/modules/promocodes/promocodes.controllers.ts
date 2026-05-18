import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { promoCodeServices } from "./promocodes.services";

const createPromoCode = catchAsync(async (req, res) => {
    const result = await promoCodeServices.createPromoCode(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Promo code created successfully",
        data: result,
    });
});

const getAllPromoCodes = catchAsync(async (req, res) => {
    const result = await promoCodeServices.getAllPromoCodes(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Promo codes retrieved successfully",
        data: result,
    });
});

const getPromoCodeById = catchAsync(async (req, res) => {
    const result = await promoCodeServices.getPromoCodeById(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Promo code retrieved successfully",
        data: result,
    });
});

const getPromoCodeByCode = catchAsync(async (req, res) => {
    const result = await promoCodeServices.getPromoCodeByCode(req.params.code as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Promo code retrieved successfully",
        data: result,
    });
});

const updatePromoCode = catchAsync(async (req, res) => {
    const result = await promoCodeServices.updatePromoCode(req.params.id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Promo code updated successfully",
        data: result,
    });
});

const deletePromoCode = catchAsync(async (req, res) => {
    const result = await promoCodeServices.deletePromoCode(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Promo code deleted successfully",
        data: result,
    });
});

const usePromoCode = catchAsync(async (req, res) => {
    const { code, orderAmount } = req.body;
    const result = await promoCodeServices.usePromoCode(code, orderAmount);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Promo code applied successfully",
        data: result,
    });
});

export const promoCodeControllers = {
    createPromoCode,
    getAllPromoCodes,
    getPromoCodeById,
    getPromoCodeByCode,
    updatePromoCode,
    deletePromoCode,
    usePromoCode,
};

import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { faqServices } from "./faq.services";
import { FAQAudienceEnum } from "./faq.interface";

const createFAQ = catchAsync(async (req: Request, res: Response) => {
    const result = await faqServices.createFAQ(req.user._id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "FAQ created successfully",
        data: result,
    });
});

// Admin: get all FAQs (including inactive), with optional filters
const getAllFAQs = catchAsync(async (req: Request, res: Response) => {
    const result = await faqServices.getAllFAQs(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQs retrieved successfully",
        data: result,
    });
});

// Public: get only active FAQs, optionally filtered by audience
const getActiveFAQs = catchAsync(async (req: Request, res: Response) => {
    const audience = req.query.audience as FAQAudienceEnum | undefined;
    const result = await faqServices.getActiveFAQs(audience);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQs retrieved successfully",
        data: result,
    });
});

const getFAQById = catchAsync(async (req: Request, res: Response) => {
    const result = await faqServices.getFAQById(req.params.faqId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQ retrieved successfully",
        data: result,
    });
});

const updateFAQ = catchAsync(async (req: Request, res: Response) => {
    const result = await faqServices.updateFAQ(req.params.faqId as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQ updated successfully",
        data: result,
    });
});

const toggleFAQStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await faqServices.toggleFAQStatus(req.params.faqId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `FAQ ${result.isActive ? "activated" : "deactivated"} successfully`,
        data: result,
    });
});

const deleteFAQ = catchAsync(async (req: Request, res: Response) => {
    await faqServices.deleteFAQ(req.params.faqId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "FAQ deleted successfully",
        data: null,
    });
});

export const faqControllers = {
    createFAQ,
    getAllFAQs,
    getActiveFAQs,
    getFAQById,
    updateFAQ,
    toggleFAQStatus,
    deleteFAQ,
};

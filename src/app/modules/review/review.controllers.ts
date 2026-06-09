import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { reviewServices } from "./review.services";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewServices.createReview(req.user._id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review created successfully",
        data: result,
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewServices.getAllReviews(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getActiveReviews = catchAsync(async (req: Request, res: Response) => {
    const restaurantId = req.query.restaurantId as string | undefined;
    const result = await reviewServices.getActiveReviews(restaurantId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews retrieved successfully",
        data: result,
    });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewServices.getReviewById(req.params.reviewId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review retrieved successfully",
        data: result,
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewServices.updateReview(req.params.reviewId as string, req.user._id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
});

const toggleReviewStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await reviewServices.toggleReviewStatus(req.params.reviewId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Review ${result.isActive ? "activated" : "deactivated"} successfully`,
        data: result,
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    await reviewServices.deleteReview(req.params.reviewId as string, req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review deleted successfully",
        data: null,
    });
});

export const reviewControllers = {
    createReview,
    getAllReviews,
    getActiveReviews,
    getReviewById,
    updateReview,
    toggleReviewStatus,
    deleteReview,
};

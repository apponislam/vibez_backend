import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ReviewModel } from "./review.model";
import { RestaurantModel } from "../restaurant/restaurant.model";
import { ReservationModel } from "../reservation/reservation.model";
import { ReservationStatus } from "../reservation/reservation.interface";

const createReview = async (userId: string, payload: any) => {
    const { restaurantId, reservationId, rating, images } = payload;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
    }

    // Validate restaurant exists
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    }

    // Validate reservation if provided
    if (reservationId) {
        const reservation = await ReservationModel.findOne({
            _id: reservationId,
            userId: new Types.ObjectId(userId),
        });

        if (!reservation) {
            throw new ApiError(httpStatus.NOT_FOUND, "Reservation not found or does not belong to you");
        }

        if (reservation.status !== ReservationStatus.COMPLETED) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You can only review a completed reservation");
        }

        // Ensure reservation belongs to the same restaurant
        if (reservation.restaurantId.toString() !== restaurantId.toString()) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Reservation does not belong to this restaurant");
        }

        // Check duplicate review for this reservation
        const existingReview = await ReviewModel.findOne({
            reservationId,
            userId: new Types.ObjectId(userId),
            isDeleted: false,
        });

        if (existingReview) {
            throw new ApiError(httpStatus.CONFLICT, "You have already reviewed this reservation");
        }
    }

    const review = await ReviewModel.create({
        ...payload,
        userId: new Types.ObjectId(userId),
    });

    return review;
};

const getAllReviews = async (filters: any = {}) => {
    const query: any = { isDeleted: false };
    if (filters.restaurantId) query.restaurantId = filters.restaurantId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === "true";

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        ReviewModel.find(query).populate("restaurantId", "restaurantName restaurantImage").populate("userId", "name email profileImage").skip(skip).limit(limit),
        ReviewModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        data: reviews,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

const getActiveReviews = async (restaurantId?: string) => {
    const filter: any = { isActive: true, isDeleted: false };
    if (restaurantId) {
        filter.restaurantId = restaurantId;
    }
    const reviews = await ReviewModel.find(filter).populate("restaurantId", "restaurantName restaurantImage").populate("userId", "name email profileImage").sort({ createdAt: -1 });
    return reviews;
};

const getReviewById = async (reviewId: string) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false }).populate("restaurantId", "restaurantName restaurantImage").populate("userId", "name email profileImage");
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    return review;
};

const updateReview = async (reviewId: string, userId: string, payload: any) => {
    const review = await ReviewModel.findOneAndUpdate(
        { _id: reviewId, userId: new Types.ObjectId(userId), isDeleted: false },
        { $set: payload },
        { returnDocument: "after", runValidators: true },
    );
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found or not authorized");
    return review;
};

const toggleReviewStatus = async (reviewId: string) => {
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false });
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    review.isActive = !review.isActive;
    await review.save();
    return review;
};

const deleteReview = async (reviewId: string, userId: string) => {
    const review = await ReviewModel.findOneAndUpdate(
        { _id: reviewId, userId: new Types.ObjectId(userId), isDeleted: false },
        { $set: { isDeleted: true, isActive: false } },
        { returnDocument: "after" },
    );
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, "Review not found or not authorized");
    return review;
};

export const reviewServices = {
    createReview,
    getAllReviews,
    getActiveReviews,
    getReviewById,
    updateReview,
    toggleReviewStatus,
    deleteReview,
};

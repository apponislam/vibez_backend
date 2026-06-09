import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { uploadReviewImages } from "../../middlewares/multer";
import { reviewControllers } from "./review.controllers";

const router = Router();

// Public routes
router.get("/", reviewControllers.getActiveReviews);
router.get("/:reviewId", reviewControllers.getReviewById);

// User routes (authenticated)
router.post("/", auth, uploadReviewImages, reviewControllers.createReview);
router.patch("/:reviewId", auth, uploadReviewImages, reviewControllers.updateReview);
router.delete("/:reviewId", auth, reviewControllers.deleteReview);

// Admin-only routes
router.get("/admin/all", auth, authorize(["ADMIN", "SUPER_ADMIN"]), reviewControllers.getAllReviews);
router.patch("/:reviewId/toggle-status", auth, authorize(["ADMIN", "SUPER_ADMIN"]), reviewControllers.toggleReviewStatus);

export const reviewRoutes = router;

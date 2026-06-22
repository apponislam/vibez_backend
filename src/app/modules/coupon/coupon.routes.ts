import { Router } from "express";
import { couponControllers } from "./coupon.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Public/Protected routes
router.post("/verify-referral", auth, couponControllers.verifyReferralCode);

// Admin routes (require ADMIN role)
router.post("/", auth, authorize(["ADMIN"]), couponControllers.createCoupon);
router.get("/", auth, authorize(["ADMIN"]), couponControllers.getAllCoupons);
router.get("/:id", auth, authorize(["ADMIN"]), couponControllers.getCouponById);
router.patch("/:id", auth, authorize(["ADMIN"]), couponControllers.updateCoupon);
router.delete("/:id", auth, authorize(["ADMIN"]), couponControllers.deleteCoupon);

export const couponRoutes = router;

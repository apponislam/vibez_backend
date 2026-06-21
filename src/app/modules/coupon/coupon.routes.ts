import { Router } from "express";
import { couponControllers } from "./coupon.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Admin routes (require ADMIN role)
router.post("/", auth, authorize(["ADMIN"]), couponControllers.createCoupon);
router.get("/", auth, authorize(["ADMIN"]), couponControllers.getAllCoupons);
router.get("/:id", auth, authorize(["ADMIN"]), couponControllers.getCouponById);
router.delete("/:id", auth, authorize(["ADMIN"]), couponControllers.deleteCoupon);

export const couponRoutes = router;

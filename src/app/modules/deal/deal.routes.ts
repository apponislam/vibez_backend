import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import checkAuth from "../../middlewares/checkAuth";
import { dealControllers } from "./deal.controllers";

const router = Router();

// Public routes
router.get("/", checkAuth, dealControllers.getActiveDeals);
router.get("/restaurant/:restaurantId", checkAuth, dealControllers.getDealsByRestaurant);

// Restaurant Owner routes
router.get("/my-deals", auth, authorize(["RESTAURANT_OWNER"]), dealControllers.getMyDeals);

// Public route with parameter (must be after specific paths like /my-deals)
router.get("/:dealId", checkAuth, dealControllers.getDealById);

// Admin & Restaurant Owner routes
router.post("/", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.createDeal);
router.get("/admin/all", auth, authorize(["ADMIN"]), dealControllers.getAllDeals);
router.get("/admin/stats", auth, authorize(["ADMIN"]), dealControllers.getAdminDealStats);
router.get("/admin/:dealId", auth, authorize(["ADMIN"]), dealControllers.getDealById);
router.patch("/:dealId", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.updateDeal);
router.patch("/:dealId/toggle-status", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.toggleDealStatus);
router.delete("/:dealId", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.deleteDeal);

export const dealRoutes = router;

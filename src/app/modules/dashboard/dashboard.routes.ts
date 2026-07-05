import { Router } from "express";
import { dashboardControllers } from "./dashboard.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Admin dashboard routes
router.get("/stats", auth, authorize(["ADMIN"]), dashboardControllers.getAdminDashboardStats);
router.get("/affiliate-stats", auth, authorize(["ADMIN"]), dashboardControllers.getAffiliateStats);

// Restaurant owner dashboard routes
router.get("/restaurant-stats", auth, authorize(["RESTAURANT_OWNER", "STAFF"]), dashboardControllers.getRestaurantOwnerDashboardStats);
router.get("/restaurant-overview", auth, authorize(["RESTAURANT_OWNER", "STAFF"]), dashboardControllers.getRestaurantOwnerOverview);
router.get("/restaurant-bookings-per-day", auth, authorize(["RESTAURANT_OWNER", "STAFF"]), dashboardControllers.getRestaurantOwnerBookingsPerDay);
router.get("/restaurant-lunch-vs-dinner", auth, authorize(["RESTAURANT_OWNER", "STAFF"]), dashboardControllers.getRestaurantOwnerMealTimeStats);
router.get("/restaurant-insights", auth, authorize(["RESTAURANT_OWNER", "STAFF"]), dashboardControllers.getRestaurantOwnerInsights);

export const dashboardRoutes = router;

import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { dealControllers } from "./deal.controllers";

const router = Router();

// Public routes
router.get("/", dealControllers.getActiveDeals);
router.get("/restaurant/:restaurantId", dealControllers.getDealsByRestaurant);

// Restaurant Owner routes
router.get("/my-deals", auth, authorize(["RESTAURANT_OWNER"]), dealControllers.getMyDeals);

// Public route with parameter (must be after specific paths like /my-deals)
router.get("/:dealId", dealControllers.getDealById);

// Admin & Restaurant Owner routes
router.post("/", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.createDeal);
router.get("/admin/all", auth, authorize(["ADMIN"]), dealControllers.getAllDeals);
router.patch("/:dealId", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.updateDeal);
router.patch("/:dealId/toggle-status", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.toggleDealStatus);
router.delete("/:dealId", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), dealControllers.deleteDeal);

export const dealRoutes = router;

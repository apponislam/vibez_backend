import { Router } from "express";
import { restaurantControllers } from "./restaurant.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import checkAuth from "../../middlewares/checkAuth";
import { uploadRestaurantImage } from "../../middlewares/multer";

const router = Router();

// Public routes
router.get("/", checkAuth, restaurantControllers.getAllRestaurants);
router.get("/admin/all", auth, authorize(["ADMIN"]), restaurantControllers.getAllRestaurantsForAdmin);
router.get("/admin/pending", auth, authorize(["ADMIN"]), restaurantControllers.getPendingRestaurantsForAdmin);
router.get("/:id", checkAuth, restaurantControllers.getRestaurantById);

// Protected routes (require auth)
router.get("/my/restaurant", auth, restaurantControllers.getMyRestaurant);
router.patch("/my/restaurant", auth, authorize(["RESTAURANT_OWNER"]), uploadRestaurantImage, restaurantControllers.updateRestaurant);
router.delete("/:id", auth, authorize(["ADMIN", "RESTAURANT_OWNER"]), restaurantControllers.deleteRestaurant);

// Admin only routes for restaurant approval
router.patch("/admin/:id", auth, authorize(["ADMIN"]), uploadRestaurantImage, restaurantControllers.updateRestaurantByAdmin);
router.patch("/:id/approve", auth, authorize(["ADMIN"]), restaurantControllers.approveRestaurant);
router.patch("/:id/revoke-approval", auth, authorize(["ADMIN"]), restaurantControllers.revokeRestaurantApproval);

export const restaurantRoutes = router;

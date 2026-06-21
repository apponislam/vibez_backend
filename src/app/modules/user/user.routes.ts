import { Router } from "express";
import { userControllers } from "./user.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Staff management routes (Accessible by RESTAURANT_OWNER and ADMIN)
router.post("/staff", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), userControllers.createStaffByOwner);
router.get("/staff", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), userControllers.getStaffByOwner);

// Admin-only dashboard endpoints
router.get("/stats", auth, authorize(["ADMIN"]), userControllers.getUserStats);
router.get("/", auth, authorize(["ADMIN"]), userControllers.getAllUsers);
router.get("/:id/activity", auth, authorize(["ADMIN"]), userControllers.getUserActivity);
router.patch("/:id/edit", auth, authorize(["ADMIN"]), userControllers.updateUserByAdmin);
router.patch("/:id/toggle-status", auth, authorize(["ADMIN"]), userControllers.toggleUserActiveStatus);

export const userRoutes = router;

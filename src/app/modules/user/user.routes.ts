import { Router } from "express";
import { userControllers } from "./user.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { uploadProfileImage } from "../../middlewares/multer";

const router = Router();

// Staff management routes (Accessible by RESTAURANT_OWNER and ADMIN)
router.post("/staff", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), uploadProfileImage, userControllers.createStaffByOwner);
router.get("/staff", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), userControllers.getStaffByOwner);
router.patch("/staff/toggle-all-login", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), userControllers.toggleAllStaffLoginStatus);
router.patch("/staff/:staffId/toggle-login", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), userControllers.toggleStaffLoginStatus);
router.patch("/staff/:staffId/password", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), userControllers.changeStaffPasswordByOwner);
router.patch("/staff/:staffId", auth, authorize(["RESTAURANT_OWNER", "ADMIN"]), uploadProfileImage, userControllers.updateStaffDetailsByOwner);

// Admin-only dashboard endpoints
router.get("/stats", auth, authorize(["ADMIN"]), userControllers.getUserStats);
router.get("/", auth, authorize(["ADMIN"]), userControllers.getAllUsers);
router.get("/:id/activity", auth, authorize(["ADMIN"]), userControllers.getUserActivity);
router.patch("/:id/edit", auth, authorize(["ADMIN"]), userControllers.updateUserByAdmin);
router.patch("/:id/toggle-status", auth, authorize(["ADMIN"]), userControllers.toggleUserActiveStatus);

export const userRoutes = router;

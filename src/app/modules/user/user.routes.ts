import { Router } from "express";
import { userControllers } from "./user.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Apply admin-only authorization to all user dashboard endpoints
router.use(auth, authorize(["ADMIN"]));

router.get("/stats", userControllers.getUserStats);
router.get("/", userControllers.getAllUsers);
router.get("/:id/activity", userControllers.getUserActivity);
router.patch("/:id/edit", userControllers.updateUserByAdmin);
router.patch("/:id/toggle-status", userControllers.toggleUserActiveStatus);

export const userRoutes = router;

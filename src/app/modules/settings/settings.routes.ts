import { Router } from "express";
import { settingsControllers } from "./settings.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Retrieve global settings (accessible to authenticated users)
router.get("/", auth, settingsControllers.getSettings);

// Update global settings (restricted to Admin/Super Admin only)
router.patch("/", auth, authorize(["ADMIN", "SUPER_ADMIN"]), settingsControllers.updateSettings);

export const settingsRoutes = router;

import { Router } from "express";
import { dashboardControllers } from "./dashboard.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Admin dashboard routes
router.get("/stats", auth, authorize(["ADMIN"]), dashboardControllers.getAdminDashboardStats);

export const dashboardRoutes = router;

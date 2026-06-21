import { Router } from "express";
import { notificationControllers } from "./notification.controllers";
import auth from "../../middlewares/auth";

const router = Router();

// Retrieve all notifications for the logged-in user
router.get("/", auth, notificationControllers.getMyNotifications);

// Mark all notifications as read
router.patch("/mark-all-read", auth, notificationControllers.markAllAsRead);

// Mark a specific notification as read
router.patch("/:id", auth, notificationControllers.markAsRead);

export const notificationRoutes = router;

import { Router } from "express";
import { reservationControllers } from "./reservation.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Protected routes (require auth)
router.post("/", auth, reservationControllers.createReservation);
router.get("/my", auth, reservationControllers.getMyReservations);
router.get("/stats", auth, authorize(["ADMIN", "RESTAURANT_OWNER", "STAFF"]), reservationControllers.getReservationStats);
router.get("/owner-stats", auth, authorize(["RESTAURANT_OWNER", "STAFF"]), reservationControllers.getOwnerStats);
router.get("/:id", auth, reservationControllers.getReservationById);
router.patch("/:id", auth, reservationControllers.updateReservation);
router.delete("/:id", auth, reservationControllers.deleteReservation);

// Admin/Owner only routes
router.get("/", auth, authorize(["ADMIN", "RESTAURANT_OWNER", "STAFF"]), reservationControllers.getAllReservations);
router.patch("/:id/status", auth, authorize(["ADMIN", "RESTAURANT_OWNER", "STAFF"]), reservationControllers.updateReservationStatus);

export const reservationRoutes = router;

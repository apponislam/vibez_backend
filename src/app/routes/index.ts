import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { publicRoutes } from "../modules/public/public.routes";
import { faqRoutes } from "../modules/faq/faq.routes";
import { promoCodeRoutes } from "../modules/promocodes/promocodes.routes";
import { restaurantRoutes } from "../modules/restaurant/restaurant.routes";
import { reservationRoutes } from "../modules/reservation/reservation.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },

    {
        path: "/public",
        route: publicRoutes,
    },
    {
        path: "/faqs",
        route: faqRoutes,
    },
    {
        path: "/promocodes",
        route: promoCodeRoutes,
    },
    {
        path: "/restaurants",
        route: restaurantRoutes,
    },
    {
        path: "/reservations",
        route: reservationRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { publicRoutes } from "../modules/public/public.routes";
import { faqRoutes } from "../modules/faq/faq.routes";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

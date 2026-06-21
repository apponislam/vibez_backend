import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { publicRoutes } from "../modules/public/public.routes";
import { faqRoutes } from "../modules/faq/faq.routes";
import { promoCodeRoutes } from "../modules/promocodes/promocodes.routes";
import { restaurantRoutes } from "../modules/restaurant/restaurant.routes";
import { reservationRoutes } from "../modules/reservation/reservation.routes";
import { subscriptionRoutes } from "../modules/subscription/subscription.routes";
import { userSubscriptionRoutes } from "../modules/usersubscription/usersubscription.routes";
import { dealRoutes } from "../modules/deal/deal.routes";
import { reviewRoutes } from "../modules/review/review.routes";
import { favoriteRoutes } from "../modules/favorite/favorite.routes";
import { savedDealRoutes } from "../modules/saved-deal/saved-deal.routes";
import { shortsRoutes } from "../modules/shorts/shorts.routes";
import { withdrawRoutes } from "../modules/withdraw/withdraw.routes";
import { couponRoutes } from "../modules/coupon/coupon.routes";
import { commissionRoutes } from "../modules/commission/commission.routes";
import { settingsRoutes } from "../modules/settings/settings.routes";
import { notificationRoutes } from "../modules/notification/notification.routes";

const router = express.Router();


const moduleRoutes = [
    {
        path: "/notifications",
        route: notificationRoutes,
    },
    {
        path: "/settings",
        route: settingsRoutes,
    },
    {
        path: "/coupons",
        route: couponRoutes,
    },
    {
        path: "/commissions",
        route: commissionRoutes,
    },
    {
        path: "/withdrawals",
        route: withdrawRoutes,
    },
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
    {
        path: "/subscriptions",
        route: subscriptionRoutes,
    },
    {
        path: "/user-subscriptions",
        route: userSubscriptionRoutes,
    },
    {
        path: "/deals",
        route: dealRoutes,
    },
    {
        path: "/reviews",
        route: reviewRoutes,
    },
    {
        path: "/favorites",
        route: favoriteRoutes,
    },
    {
        path: "/saved-deals",
        route: savedDealRoutes,
    },
    {
        path: "/shorts",
        route: shortsRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

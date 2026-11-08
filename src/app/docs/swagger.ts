import { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSchemas } from "./schemas";
import { authPaths } from "./paths/auth.docs";
import { userPaths } from "./paths/users.docs";
import { dashboardPaths } from "./paths/dashboard.docs";
import { restaurantPaths } from "./paths/restaurant.docs";
import { reservationPaths } from "./paths/reservation.docs";
import { dealPaths } from "./paths/deal.docs";
import { subscriptionPaths } from "./paths/subscription.docs";
import { financePaths } from "./paths/finance.docs";
import { engagementPaths } from "./paths/engagement.docs";
import { systemPaths } from "./paths/system.docs";

export const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "VIBEZ REST API Documentation",
        version: "1.0.0",
        description: `
## 🚀 Welcome to the VIBEZ Backend API Engine

The **VIBEZ API** provides comprehensive infrastructure for:
- 🔐 **Authentication & Role-Based Access Control** (Users, Restaurant Owners, Staff Managers/Cashiers/Waiters, Platform Admins)
- 🍕 **Restaurant Discovery & Geo-Search** (GPS distance radius search, cuisine & food filtering, open/close status)
- 🎟️ **Promotional Deals & Offers** (2-for-1 specials, free items, percent & fixed discounts, claim limitations)
- 📅 **Real-time Table Reservations** (Time slots, party size, live booking status workflow)
- 💳 **Stripe Subscription Billing & Checkout** (Monthly & yearly VIP passes, automated webhooks, trial support)
- 🤝 **Affiliate Referrals & Influencer Commissions** (Lifetime & customized duration percentages, Stripe Connect payouts)
- 🎥 **Short Video Reels & Social Discovery** (Food shorts feeds, bookmarking, and shares)
- ⭐ **Reviews & Ratings** (Verified diner feedback with photo attachments)
- 🔔 **Push Notifications & Live Sockets** (Firebase Cloud Messaging & Socket.io)

### Authentication
Most protected endpoints require an **Authorization** header with a valid JWT Bearer token:
\`\`\`http
Authorization: Bearer <your_jwt_access_token>
\`\`\`
Click the **Authorize** button on the right to enter your token once and test all protected endpoints seamlessly.
        `,
        contact: {
            name: "VIBEZ Engineering Team",
            email: "support@getvibez.app",
            url: "https://getvibez.app",
        },
        license: {
            name: "Proprietary",
            url: "https://getvibez.app/terms",
        },
    },
    servers: [
        {
            url: "/api/v1",
            description: "Current Host API v1 (Relative Server)",
        },
        {
            url: "http://localhost:5000/api/v1",
            description: "Local Development Server",
        },
        {
            url: "https://vibez.apponislam.top/api/v1",
            description: "Staging / Remote Development Server",
        },
        {
            url: "https://api.getvibez.app/api/v1",
            description: "Production Server",
        },
    ],
    tags: [
        { name: "Authentication", description: "Customer & Owner account registration, login, JWT refresh, password resets, profile updates" },
        { name: "Users & Staff", description: "Platform user listings, staff account management (Manager/Cashier/Waiter), login permissions, activity logs" },
        { name: "Dashboard & Analytics", description: "Admin KPIs, restaurant owner real-time statistics, booking heatmaps, lunch vs dinner breakdowns" },
        { name: "Restaurants", description: "Restaurant profiles, geo-proximity search, operating hours, cover photos, admin approval workflow" },
        { name: "Reservations", description: "Table booking lifecycle (Upcoming, Arrived, Completed, Cancelled), stats and limits" },
        { name: "Deals & Promotions", description: "Restaurant promotional offers (2-for-1, free items, percentage discounts, claim limits)" },
        { name: "Subscriptions & Plans", description: "Platform membership subscription plans (Monthly, Annual), pricing tiers, and limits" },
        { name: "User Subscriptions", description: "Stripe checkout session initiation, user active subscription tracking, renewal, cancellations" },
        { name: "Stripe & Webhooks", description: "Asynchronous webhook listeners for Stripe invoices, subscription lifecycles, and checkouts" },
        { name: "Finance & Withdrawals", description: "Affiliate wallet balances, Stripe Connect Express onboarding, withdrawal approval workflow" },
        { name: "Affiliates & Commissions", description: "Referral commissions tracking, payout durations, and partner rate management" },
        { name: "Customer Reviews", description: "Verified diner ratings and comments with multi-image photo uploads" },
        { name: "Shorts & Reels", description: "Short-form promotional video feed, video uploads, shares, and bookmarks" },
        { name: "Favorites & Bookmarks", description: "User favorite restaurants and saved deals" },
        { name: "Coupons & Referrals", description: "Stripe coupons, signup referral codes, and discount verifications" },
        { name: "Promo Codes", description: "Merchant promo codes with limits and checkout validation" },
        { name: "FAQs", description: "Frequently asked questions management" },
        { name: "Notifications", description: "In-app and push notification histories" },
        { name: "System Settings", description: "Global platform configuration, auto-approval toggles, default commission values" },
        { name: "Public Legal & Policies", description: "Terms and conditions, privacy policies, and refund documentation" },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter your JWT Bearer token in the format: Bearer <token>",
            },
        },
        schemas: openApiSchemas,
    },
    paths: {
        ...authPaths,
        ...userPaths,
        ...dashboardPaths,
        ...restaurantPaths,
        ...reservationPaths,
        ...dealPaths,
        ...subscriptionPaths,
        ...financePaths,
        ...engagementPaths,
        ...systemPaths,
    },
};

// Premium Custom CSS for Swagger UI with VIBEZ Dark Brand Theme
const customCss = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    :root {
        --brand-red: #cf0738;
        --brand-red-glow: rgba(207, 7, 56, 0.35);
        --dark-bg: #030712;
        --card-bg: #0b1120;
        --surface-hover: #111827;
        --border-color: rgba(255, 255, 255, 0.08);
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
    }

    body {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif !important;
        background-color: var(--dark-bg) !important;
        color: var(--text-main) !important;
        margin: 0;
    }

    .swagger-ui {
        font-family: 'Outfit', sans-serif !important;
        color: var(--text-main) !important;
    }

    .swagger-ui .topbar {
        background: linear-gradient(135deg, #090d16 0%, #17050d 100%) !important;
        border-bottom: 1px solid var(--border-color);
        padding: 1rem 2rem !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .swagger-ui .topbar .topbar-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .swagger-ui .topbar-wrapper img {
        height: 38px !important;
        content: url('/logo.svg');
    }

    .swagger-ui .topbar-wrapper .link {
        font-weight: 800;
        font-size: 1.35rem;
        letter-spacing: 0.05em;
        color: #ffffff !important;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .swagger-ui .info {
        margin: 2.5rem 0 !important;
    }

    .swagger-ui .info .title {
        color: #ffffff !important;
        font-weight: 800 !important;
        font-size: 2.5rem !important;
        letter-spacing: -0.02em;
    }

    .swagger-ui .info .title small.version-stamp {
        background: var(--brand-red) !important;
        border-radius: 9999px;
        padding: 4px 12px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        margin-left: 12px;
        box-shadow: 0 0 15px var(--brand-red-glow);
    }

    .swagger-ui .info p, .swagger-ui .info li {
        color: var(--text-muted) !important;
        font-size: 0.95rem;
        line-height: 1.6;
    }

    .swagger-ui .info h2 {
        color: #ffffff !important;
        font-size: 1.4rem;
        font-weight: 700;
        margin-top: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.5rem;
    }

    .swagger-ui .scheme-container {
        background: var(--card-bg) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 16px !important;
        padding: 1.25rem 2rem !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25) !important;
        margin-bottom: 2rem !important;
    }

    .swagger-ui .btn.authorize {
        background: var(--brand-red) !important;
        color: #ffffff !important;
        border-color: var(--brand-red) !important;
        border-radius: 10px !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 14px var(--brand-red-glow) !important;
        transition: all 0.2s ease;
    }

    .swagger-ui .btn.authorize:hover {
        background: #e6093f !important;
        transform: translateY(-1px);
    }

    .swagger-ui .btn.authorize svg {
        fill: #ffffff !important;
    }

    .swagger-ui .opblock-tag {
        color: #ffffff !important;
        font-size: 1.35rem !important;
        font-weight: 700 !important;
        border-bottom: 1px solid var(--border-color) !important;
        padding: 1.25rem 0.5rem !important;
    }

    .swagger-ui .opblock-tag small {
        color: var(--text-muted) !important;
        font-size: 0.85rem !important;
    }

    .swagger-ui .opblock {
        background: var(--card-bg) !important;
        border-radius: 14px !important;
        border: 1px solid var(--border-color) !important;
        margin-bottom: 1rem !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        overflow: hidden;
    }

    .swagger-ui .opblock .opblock-summary {
        padding: 0.75rem 1.25rem !important;
    }

    .swagger-ui .opblock .opblock-summary-method {
        border-radius: 8px !important;
        font-weight: 800 !important;
        font-size: 0.8rem !important;
        padding: 6px 14px !important;
        letter-spacing: 0.05em !important;
        min-width: 80px;
        text-align: center;
    }

    .swagger-ui .opblock-get .opblock-summary-method { background: #0284c7 !important; color: #fff !important; }
    .swagger-ui .opblock-post .opblock-summary-method { background: #16a34a !important; color: #fff !important; }
    .swagger-ui .opblock-patch .opblock-summary-method { background: #f59e0b !important; color: #fff !important; }
    .swagger-ui .opblock-delete .opblock-summary-method { background: var(--brand-red) !important; color: #fff !important; }
    .swagger-ui .opblock-put .opblock-summary-method { background: #ea580c !important; color: #fff !important; }

    .swagger-ui .opblock .opblock-summary-path {
        color: #f1f5f9 !important;
        font-weight: 600 !important;
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.95rem !important;
    }

    .swagger-ui .opblock .opblock-summary-description {
        color: var(--text-muted) !important;
        font-size: 0.85rem !important;
    }

    .swagger-ui .opblock .opblock-body {
        background: #060a14 !important;
        border-top: 1px solid var(--border-color) !important;
    }

    .swagger-ui section.models {
        background: var(--card-bg) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 16px !important;
    }

    .swagger-ui section.models h4 {
        color: #ffffff !important;
        font-weight: 700 !important;
    }

    .swagger-ui .model-box {
        background: #060a14 !important;
        border-radius: 8px;
    }

    .swagger-ui .model, .swagger-ui .model-title {
        color: #f1f5f9 !important;
        font-family: 'JetBrains Mono', monospace !important;
    }

    .swagger-ui table thead tr th, .swagger-ui table thead tr td {
        color: #ffffff !important;
        border-bottom: 1px solid var(--border-color) !important;
    }

    .swagger-ui .parameter__name {
        color: #ffffff !important;
        font-weight: 600 !important;
        font-family: 'JetBrains Mono', monospace !important;
    }

    .swagger-ui .parameter__type {
        color: var(--brand-red) !important;
    }

    .swagger-ui input[type="text"], .swagger-ui textarea, .swagger-ui select {
        background: #0b1120 !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        border-radius: 8px !important;
        font-family: 'JetBrains Mono', monospace !important;
    }

    .swagger-ui .btn.execute {
        background: var(--brand-red) !important;
        border-color: var(--brand-red) !important;
        color: #ffffff !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 12px var(--brand-red-glow) !important;
    }

    .swagger-ui .btn.execute:hover {
        background: #e6093f !important;
    }

    .swagger-ui .responses-inner {
        padding: 1rem 0 !important;
    }

    .swagger-ui .response-col_status {
        color: #ffffff !important;
        font-weight: 700 !important;
    }

    .swagger-ui .highlight-code {
        border-radius: 8px !important;
        overflow: hidden;
    }
`;

export const swaggerUiOptions = {
    customCss,
    customSiteTitle: "VIBEZ API Documentation",
    customfavIcon: "/favicon.png",
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        tagsSorter: "alpha",
    },
};

export const serveSwaggerUi = swaggerUi.serve;
export const setupSwaggerUi = swaggerUi.setup(swaggerSpec, swaggerUiOptions);

export const getSwaggerJson = (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(swaggerSpec);
};

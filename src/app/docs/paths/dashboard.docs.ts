export const dashboardPaths = {
    "/dashboard/stats": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get overall platform stats (Admin only)",
            description: "Returns platform overview metrics: total users, active subscriptions, total revenue, commission payouts, and active restaurants.",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Admin dashboard stats retrieved successfully" },
            },
        },
    },

    "/dashboard/affiliate-stats": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get affiliate & referral performance metrics (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Affiliate metrics retrieved successfully" },
            },
        },
    },

    "/dashboard/admin-restaurant-stats": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get restaurant ecosystem metrics (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Restaurant overview stats retrieved" },
            },
        },
    },

    "/dashboard/restaurant-stats": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get restaurant key metrics (Restaurant Owner / Staff)",
            description: "Returns today's bookings, total reservations, claimed deals, and active deals count.",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Restaurant stats retrieved" },
            },
        },
    },

    "/dashboard/restaurant-overview": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get historical bookings overview (Restaurant Owner / Staff)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "period", schema: { type: "string", enum: ["today", "week", "month", "year"], default: "week" } },
            ],
            responses: {
                200: { description: "Restaurant overview graph retrieved" },
            },
        },
    },

    "/dashboard/restaurant-bookings-per-day": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get daily booking distribution by month (Restaurant Owner / Staff)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "month", schema: { type: "integer", example: 11 } },
                { in: "query", name: "year", schema: { type: "integer", example: 2026 } },
            ],
            responses: {
                200: { description: "Bookings per day retrieved" },
            },
        },
    },

    "/dashboard/restaurant-lunch-vs-dinner": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get lunch vs dinner breakdown (Restaurant Owner / Staff)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "period", schema: { type: "string", enum: ["today", "week", "month", "year"], default: "month" } },
            ],
            responses: {
                200: { description: "Meal time distribution stats retrieved" },
            },
        },
    },

    "/dashboard/restaurant-insights": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get booking peak times and top claimed deals (Restaurant Owner / Staff)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Restaurant insights retrieved" },
            },
        },
    },

    "/dashboard/restaurant-realtime-stats": {
        get: {
            tags: ["Dashboard & Analytics"],
            summary: "Get live seated and pending guests (Restaurant Owner / Staff)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Realtime metrics retrieved" },
            },
        },
    },
};

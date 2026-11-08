export const subscriptionPaths = {
    "/subscriptions/plans": {
        get: {
            tags: ["Subscriptions & Plans"],
            summary: "List all active subscription plans (Public)",
            description: "Returns all subscription pricing tiers (MONTHLY, HALF_YEARLY, YEARLY, TWO_YEARLY) for customer app subscription checkout.",
            responses: {
                200: {
                    description: "List of subscription plans",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/SubscriptionPlan" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            tags: ["Subscriptions & Plans"],
            summary: "Create a subscription plan (Admin only)",
            description: "Creates plan in the database and automatically synchronizes product and recurring pricing in Stripe.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["name", "price", "duration"],
                            properties: {
                                name: { type: "string", example: "VIBEZ Premium Annual Pass" },
                                price: { type: "number", example: 89.9 },
                                duration: {
                                    type: "string",
                                    enum: ["MONTHLY", "HALF_YEARLY", "YEARLY", "TWO_YEARLY"],
                                    example: "YEARLY",
                                },
                                isFreeTrial: { type: "boolean", default: false },
                                freeTrialDays: { type: "number", example: 14 },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Subscription plan created" },
            },
        },
    },

    "/subscriptions/admin-stats": {
        get: {
            tags: ["Subscriptions & Plans"],
            summary: "Get platform subscription financial stats (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Subscription revenue stats" },
            },
        },
    },

    "/subscriptions/plans/{id}": {
        get: {
            tags: ["Subscriptions & Plans"],
            summary: "Get plan by ID (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Plan details" },
            },
        },
        patch: {
            tags: ["Subscriptions & Plans"],
            summary: "Update subscription plan (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                price: { type: "number" },
                                isFreeTrial: { type: "boolean" },
                                freeTrialDays: { type: "number" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Plan updated" },
            },
        },
        delete: {
            tags: ["Subscriptions & Plans"],
            summary: "Delete subscription plan (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Plan deleted" },
            },
        },
    },

    "/user-subscriptions/checkout": {
        post: {
            tags: ["User Subscriptions"],
            summary: "Create Stripe checkout session for plan subscription",
            description: "Generates a Stripe Checkout session URL or Payment Sheet credentials for subscribing with optional promo code and referral code.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["subscriptionPlanId"],
                            properties: {
                                subscriptionPlanId: { type: "string", example: "661fa1c2f993d0319ca70c99" },
                                couponCode: { type: "string", example: "LAUNCH20" },
                                referralCode: { type: "string", example: "VBZ-98210" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Checkout session created",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "object",
                                        properties: {
                                            sessionId: { type: "string", example: "cs_test_..." },
                                            url: { type: "string", example: "https://checkout.stripe.com/c/pay/..." },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/user-subscriptions": {
        get: {
            tags: ["User Subscriptions"],
            summary: "Get customer's current subscriptions",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "User subscriptions list",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/UserSubscription" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/user-subscriptions/{id}": {
        get: {
            tags: ["User Subscriptions"],
            summary: "Get user subscription details by ID",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Subscription details" },
            },
        },
    },

    "/user-subscriptions/{id}/cancel": {
        patch: {
            tags: ["User Subscriptions"],
            summary: "Cancel auto-renewal of subscription",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Subscription cancelled at period end" },
            },
        },
    },

    "/user-subscriptions/{id}/resume": {
        patch: {
            tags: ["User Subscriptions"],
            summary: "Resume a cancelled subscription",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Subscription resumed" },
            },
        },
    },

    "/user-subscriptions/admin/all": {
        get: {
            tags: ["User Subscriptions"],
            summary: "List all user subscriptions across platform (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "status", schema: { type: "string", enum: ["ACTIVE", "CANCELLED", "EXPIRED"] } },
                { in: "query", name: "search", schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Admin user subscriptions list" },
            },
        },
    },

    "/user-subscriptions/admin/revenue-breakdown": {
        get: {
            tags: ["User Subscriptions"],
            summary: "Get subscription revenue breakdown by tier (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Revenue breakdown data" },
            },
        },
    },

    "/user-subscriptions/admin/monthly-commission-graph": {
        get: {
            tags: ["User Subscriptions"],
            summary: "Monthly commission payouts graph data (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Monthly commission chart points" },
            },
        },
    },

    "/subscription/webhook": {
        post: {
            tags: ["Stripe & Webhooks"],
            summary: "Stripe payment and subscription webhook listener",
            description: "Receives raw Stripe webhook payloads. Handles events: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted.",
            parameters: [
                {
                    in: "header",
                    name: "stripe-signature",
                    required: true,
                    schema: { type: "string" },
                    description: "Stripe HMAC signature for cryptographic verification",
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { type: "object", description: "Raw Stripe event payload" },
                    },
                },
            },
            responses: {
                200: { description: "Webhook received and verified successfully" },
                400: { description: "Webhook signature verification error" },
            },
        },
    },
};

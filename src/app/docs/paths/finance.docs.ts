export const financePaths = {
    "/withdrawals/onboarding-complete": {
        get: {
            tags: ["Finance & Withdrawals"],
            summary: "Stripe Connect onboarding return URL",
            description: "Deep link redirect after user finishes setting up their Stripe Express account for payouts.",
            responses: {
                200: { description: "Redirect executed" },
            },
        },
    },

    "/withdrawals/onboarding-refresh": {
        get: {
            tags: ["Finance & Withdrawals"],
            summary: "Stripe Connect onboarding refresh URL",
            description: "Deep link redirect if Stripe onboarding link expires.",
            responses: {
                200: { description: "Redirect executed" },
            },
        },
    },

    "/withdrawals/connect-status": {
        get: {
            tags: ["Finance & Withdrawals"],
            summary: "Check user's Stripe Connect account status",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "Connect status details",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    isConnected: { type: "boolean", example: true },
                                    accountId: { type: "string", example: "acct_1Ov..." },
                                    payoutsEnabled: { type: "boolean", example: true },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/withdrawals/connect-account": {
        post: {
            tags: ["Finance & Withdrawals"],
            summary: "Create or get Stripe Connect Express onboarding URL",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "Onboarding link created",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    url: { type: "string", example: "https://connect.stripe.com/setup/s/..." },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/withdrawals/request": {
        post: {
            tags: ["Finance & Withdrawals"],
            summary: "Submit a withdrawal payout request",
            description: "Withdraw accumulated affiliate commission balance. Supports direct STRIPE transfer or manual BANK payout.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["amount", "paymentMethod"],
                            properties: {
                                amount: { type: "number", minimum: 10, example: 100 },
                                paymentMethod: { type: "string", enum: ["STRIPE", "BANK"], example: "STRIPE" },
                                paymentDetails: {
                                    type: "object",
                                    properties: {
                                        iban: { type: "string", example: "CH9300000000000000000" },
                                        bankName: { type: "string", example: "UBS Switzerland" },
                                        accountHolder: { type: "string", example: "John Doe" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Withdrawal request submitted" },
                400: { description: "Insufficient balance or invalid payment method" },
            },
        },
    },

    "/withdrawals/my-withdrawals": {
        get: {
            tags: ["Finance & Withdrawals"],
            summary: "Get customer's withdrawal payout history",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "List of withdrawals",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Withdrawal" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/withdrawals/stats": {
        get: {
            tags: ["Finance & Withdrawals"],
            summary: "Get platform withdrawal metrics (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Withdrawal statistics" },
            },
        },
    },

    "/withdrawals/all": {
        get: {
            tags: ["Finance & Withdrawals"],
            summary: "List all withdrawal requests (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "status", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] } },
            ],
            responses: {
                200: { description: "Admin withdrawals list" },
            },
        },
    },

    "/withdrawals/{id}/approve": {
        patch: {
            tags: ["Finance & Withdrawals"],
            summary: "Approve withdrawal request (Admin only)",
            description: "Approves the payout request and executes an automated Stripe transfer if STRIPE method was selected.",
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
                                adminFeedback: { type: "string", example: "Payout approved and sent to bank." },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Withdrawal approved" },
            },
        },
    },

    "/withdrawals/{id}/reject": {
        patch: {
            tags: ["Finance & Withdrawals"],
            summary: "Reject withdrawal request (Admin only)",
            description: "Rejects request and refunds the withdrawal amount back to user's balance.",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["adminFeedback"],
                            properties: {
                                adminFeedback: { type: "string", example: "Invalid bank details provided. Please update." },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Withdrawal rejected" },
            },
        },
    },

    "/commissions": {
        get: {
            tags: ["Affiliates & Commissions"],
            summary: "List all active affiliate commission links (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "search", schema: { type: "string" } },
                { in: "query", name: "isActive", schema: { type: "boolean" } },
            ],
            responses: {
                200: {
                    description: "Commissions list",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Commission" },
                                    },
                                    meta: { $ref: "#/components/schemas/ApiResponse/properties/meta" },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/commissions/stats": {
        get: {
            tags: ["Affiliates & Commissions"],
            summary: "Get monthly commission statistics (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Commission stats" },
            },
        },
    },

    "/commissions/{id}": {
        get: {
            tags: ["Affiliates & Commissions"],
            summary: "Get commission details by ID (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Commission details" },
            },
        },
        patch: {
            tags: ["Affiliates & Commissions"],
            summary: "Update commission percentage / limits (Admin only)",
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
                                commissionPercentage: { type: "number", example: 12 },
                                maxPayout: { type: "number", example: 600 },
                                commissionDuration: { type: "number", example: 12 },
                                isActive: { type: "boolean" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Commission updated" },
            },
        },
    },
};

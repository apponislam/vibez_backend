export const systemPaths = {
    // Coupons
    "/coupons/verify-referral": {
        post: {
            tags: ["Coupons & Referrals"],
            summary: "Verify referral code and apply bonus coupon",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["referralCode"],
                            properties: {
                                referralCode: { type: "string", example: "VBZ-98210" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Referral code verified" },
            },
        },
        get: {
            tags: ["Coupons & Referrals"],
            summary: "Verify referral code via query param",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "referralCode", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Referral code verified" },
            },
        },
    },

    "/coupons": {
        get: {
            tags: ["Coupons & Referrals"],
            summary: "List all platform discount coupons (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "Coupons list",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Coupon" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            tags: ["Coupons & Referrals"],
            summary: "Create a new coupon in Stripe & DB (Admin only)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["couponId", "duration"],
                            properties: {
                                couponId: { type: "string", example: "WINTER25" },
                                name: { type: "string", example: "Winter Sale 25% Off" },
                                percentOff: { type: "number", example: 25 },
                                amountOff: { type: "number", example: 0 },
                                currency: { type: "string", example: "chf" },
                                duration: { type: "string", enum: ["once", "repeating", "forever"], example: "once" },
                                durationInMonths: { type: "number", example: 1 },
                                isDefault: { type: "boolean", default: false, description: "Indicates if this is a default coupon for referrals" },
                                selectedPlans: { type: "array", items: { type: "string" }, description: "SubscriptionPlan IDs this coupon is restricted to (optional for both direct use and default referral)" },
                                isDirectUse: { type: "boolean", default: true },
                                maxRedemptions: { type: "number", example: 100 },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Coupon created" },
            },
        },
    },

    "/coupons/{id}": {
        get: {
            tags: ["Coupons & Referrals"],
            summary: "Get coupon by ID (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Coupon details" },
            },
        },
        patch: {
            tags: ["Coupons & Referrals"],
            summary: "Update coupon (Admin only)",
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
                                isActive: { type: "boolean" },
                                isDefault: { type: "string", enum: ["ALL", "SELECTED"] },
                                selectedPlans: { type: "array", items: { type: "string" }, description: "SubscriptionPlan IDs when isDefault is 'SELECTED'" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Coupon updated" },
            },
        },
        delete: {
            tags: ["Coupons & Referrals"],
            summary: "Delete coupon from Stripe & DB (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Coupon deleted" },
            },
        },
    },

    // Promo Codes
    "/promocodes": {
        post: {
            tags: ["Promo Codes"],
            summary: "Create a promotional discount code",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["code", "discountPercentage"],
                            properties: {
                                code: { type: "string", example: "VIPGUEST" },
                                discountPercentage: { type: "number", example: 15 },
                                maxDiscountAmount: { type: "number", example: 30 },
                                minOrderAmount: { type: "number", example: 50 },
                                startDate: { type: "string", format: "date-time" },
                                endDate: { type: "string", format: "date-time" },
                                usageLimit: { type: "number", example: 100 },
                                restaurantId: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Promo code created" },
            },
        },
        get: {
            tags: ["Promo Codes"],
            summary: "List all promo codes",
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "restaurantId", schema: { type: "string" } },
                { in: "query", name: "isActive", schema: { type: "boolean" } },
            ],
            responses: {
                200: { description: "Promo codes list" },
            },
        },
    },

    "/promocodes/{id}": {
        get: {
            tags: ["Promo Codes"],
            summary: "Get promo code by ID",
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Promo code details" },
            },
        },
        patch: {
            tags: ["Promo Codes"],
            summary: "Update promo code",
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Promo code updated" },
            },
        },
        delete: {
            tags: ["Promo Codes"],
            summary: "Delete promo code",
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Promo code deleted" },
            },
        },
    },

    "/promocodes/code/{code}": {
        get: {
            tags: ["Promo Codes"],
            summary: "Look up promo code by string code",
            parameters: [
                { in: "path", name: "code", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Promo code details" },
            },
        },
    },

    "/promocodes/use": {
        post: {
            tags: ["Promo Codes"],
            summary: "Apply/Validate promo code against an order amount",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["code"],
                            properties: {
                                code: { type: "string", example: "VIPGUEST" },
                                orderAmount: { type: "number", example: 85 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Promo code verified and discount computed" },
            },
        },
    },

    // FAQs
    "/faqs": {
        get: {
            tags: ["FAQs"],
            summary: "Get active frequently asked questions (Public)",
            responses: {
                200: {
                    description: "List of FAQs",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/FAQ" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            tags: ["FAQs"],
            summary: "Create a new FAQ (Admin only)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["question", "answer"],
                            properties: {
                                question: { type: "string", example: "How do I upgrade to VIP?" },
                                answer: { type: "string", example: "Select any plan in your profile under Subscriptions." },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "FAQ created successfully" },
            },
        },
    },

    "/faqs/admin/all": {
        get: {
            tags: ["FAQs"],
            summary: "List all FAQs including inactive (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Admin FAQs list" },
            },
        },
    },

    "/faqs/{faqId}": {
        get: {
            tags: ["FAQs"],
            summary: "Get FAQ details by ID",
            parameters: [
                { in: "path", name: "faqId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "FAQ details" },
            },
        },
        patch: {
            tags: ["FAQs"],
            summary: "Update FAQ (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "faqId", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                question: { type: "string" },
                                answer: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "FAQ updated" },
            },
        },
        delete: {
            tags: ["FAQs"],
            summary: "Delete FAQ (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "faqId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "FAQ deleted" },
            },
        },
    },

    "/faqs/{faqId}/toggle-status": {
        patch: {
            tags: ["FAQs"],
            summary: "Toggle FAQ active status (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "faqId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "FAQ status toggled" },
            },
        },
    },

    // Notifications
    "/notifications": {
        get: {
            tags: ["Notifications"],
            summary: "Get notifications for logged-in user",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "User notifications",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Notification" },
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

    "/notifications/mark-all-read": {
        patch: {
            tags: ["Notifications"],
            summary: "Mark all notifications as read",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "All notifications marked as read" },
            },
        },
    },

    "/notifications/{id}": {
        patch: {
            tags: ["Notifications"],
            summary: "Mark single notification as read",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Notification marked as read" },
            },
        },
    },

    // Settings
    "/settings": {
        get: {
            tags: ["System Settings"],
            summary: "Get system configuration settings",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "Global settings",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/Settings" },
                                },
                            },
                        },
                    },
                },
            },
        },
        patch: {
            tags: ["System Settings"],
            summary: "Update system settings (Admin only)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                defaultMaxPayout: { type: "number", example: 1000 },
                                defaultCommisionPercentage: { type: "number", example: 15 },
                                defaultCommissionDuration: { type: "number", example: 12 },
                                emailNotification: { type: "boolean" },
                                pushNotification: { type: "boolean" },
                                allowAutoApproveNewResturant: { type: "boolean" },
                                allowAutoApproveResturantDeals: { type: "boolean" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Settings updated successfully" },
            },
        },
    },

    // Public Policies
    "/public": {
        get: {
            tags: ["Public Legal & Policies"],
            summary: "Get all public policies (Terms, Privacy, Refund)",
            responses: {
                200: {
                    description: "All public policies",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Policy" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            tags: ["Public Legal & Policies"],
            summary: "Create or update a policy document (Admin only)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["type", "title", "content"],
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["terms-and-conditions", "privacy-policy", "refund-policy"],
                                    example: "terms-and-conditions",
                                },
                                title: { type: "string", example: "Terms and Conditions of Use" },
                                content: { type: "string", example: "<p>Welcome to VIBEZ...</p>" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Policy saved successfully" },
            },
        },
    },

    "/public/{type}": {
        get: {
            tags: ["Public Legal & Policies"],
            summary: "Get single policy by type",
            parameters: [
                {
                    in: "path",
                    name: "type",
                    required: true,
                    schema: { type: "string", enum: ["terms-and-conditions", "privacy-policy", "refund-policy"] },
                    example: "terms-and-conditions",
                },
            ],
            responses: {
                200: {
                    description: "Policy details",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/Policy" },
                                },
                            },
                        },
                    },
                },
                404: { description: "Policy not found" },
            },
        },
        delete: {
            tags: ["Public Legal & Policies"],
            summary: "Delete policy by type (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "type", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Policy deleted successfully" },
            },
        },
    },
};

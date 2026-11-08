export const dealPaths = {
    "/deals": {
        get: {
            tags: ["Deals & Promotions"],
            summary: "Get active promotional deals",
            description: "Fetches live deals with optional filters for restaurant ID, deal type, day of week, and pagination.",
            parameters: [
                { in: "query", name: "restaurantId", schema: { type: "string" } },
                { in: "query", name: "dealType", schema: { type: "string", enum: ["TWO_FOR_ONE", "FREE_ITEM", "PERCENT_DISCOUNT", "FIXED_DISCOUNT"] } },
                { in: "query", name: "day", schema: { type: "string", enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "Active deals retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Deal" },
                                    },
                                    meta: { $ref: "#/components/schemas/ApiResponse/properties/meta" },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            tags: ["Deals & Promotions"],
            summary: "Create a new deal (Admin / Restaurant Owner)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["restaurantId", "dealType", "title", "day", "mealTime", "maxClaimsPerDay"],
                            properties: {
                                restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
                                dealType: {
                                    type: "string",
                                    enum: ["TWO_FOR_ONE", "FREE_ITEM", "PERCENT_DISCOUNT", "FIXED_DISCOUNT"],
                                    example: "TWO_FOR_ONE",
                                },
                                title: { type: "string", example: "2-for-1 Main Course" },
                                description: { type: "string", example: "Buy 1 main course, get 1 free" },
                                day: {
                                    type: "array",
                                    items: { type: "string", enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] },
                                    example: ["WEDNESDAY", "THURSDAY"],
                                },
                                mealTime: { type: "string", enum: ["LUNCH", "DINNER"], example: "DINNER" },
                                resturantHours: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            day: { type: "string", example: "WEDNESDAY" },
                                            start: { type: "string", example: "18:00" },
                                            end: { type: "string", example: "22:00" },
                                        },
                                    },
                                },
                                maxClaimsPerDay: { type: "number", example: 10 },
                                twoForOne: {
                                    type: "object",
                                    properties: {
                                        appliesTo: { type: "string", enum: ["MAIN_COURSE", "DRINKS", "DESSERTS", "STARTERS"], example: "MAIN_COURSE" },
                                    },
                                },
                                freeItem: {
                                    type: "object",
                                    properties: {
                                        buy: { type: "string", enum: ["MAIN_COURSE", "MENU", "MAIN_COURSE_PLUS_DRINK"], example: "MAIN_COURSE" },
                                        get: { type: "string", enum: ["DRINK", "DESSERT", "STARTER"], example: "DESSERT" },
                                    },
                                },
                                percentDiscount: {
                                    type: "object",
                                    properties: {
                                        percentage: { type: "number", enum: [10, 15, 20, 30], example: 20 },
                                        appliesTo: { type: "string", enum: ["ENTIRE_ORDER", "CATEGORY"], example: "ENTIRE_ORDER" },
                                    },
                                },
                                fixedDiscount: {
                                    type: "object",
                                    properties: {
                                        minSpend: { type: "number", example: 60 },
                                        amount: { type: "number", example: 15 },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Deal created successfully" },
            },
        },
    },

    "/deals/restaurant/{restaurantId}": {
        get: {
            tags: ["Deals & Promotions"],
            summary: "Get deals for a specific restaurant",
            parameters: [
                { in: "path", name: "restaurantId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Deals for restaurant" },
            },
        },
    },

    "/deals/my-deals": {
        get: {
            tags: ["Deals & Promotions"],
            summary: "Get restaurant owner's own deals",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Owner's deals retrieved" },
            },
        },
    },

    "/deals/admin/all": {
        get: {
            tags: ["Deals & Promotions"],
            summary: "List all platform deals (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "search", schema: { type: "string" } },
                { in: "query", name: "isActive", schema: { type: "boolean" } },
            ],
            responses: {
                200: { description: "Admin deals retrieved" },
            },
        },
    },

    "/deals/admin/stats": {
        get: {
            tags: ["Deals & Promotions"],
            summary: "Get deal analytics (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Deal statistics" },
            },
        },
    },

    "/deals/{dealId}": {
        get: {
            tags: ["Deals & Promotions"],
            summary: "Get deal details by ID",
            parameters: [
                { in: "path", name: "dealId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: {
                    description: "Deal details",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/Deal" },
                                },
                            },
                        },
                    },
                },
            },
        },
        patch: {
            tags: ["Deals & Promotions"],
            summary: "Update deal details (Admin / Owner)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "dealId", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                maxClaimsPerDay: { type: "number" },
                                day: { type: "array", items: { type: "string" } },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Deal updated successfully" },
            },
        },
        delete: {
            tags: ["Deals & Promotions"],
            summary: "Delete deal (Admin / Owner)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "dealId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Deal deleted successfully" },
            },
        },
    },

    "/deals/{dealId}/toggle-status": {
        patch: {
            tags: ["Deals & Promotions"],
            summary: "Toggle deal active/inactive status (Admin / Owner)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "dealId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Deal status toggled" },
            },
        },
    },
};

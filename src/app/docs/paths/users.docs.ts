export const userPaths = {
    "/users/staff": {
        post: {
            tags: ["Users & Staff"],
            summary: "Create staff account (Restaurant Owner / Admin)",
            description: "Allows a restaurant owner or admin to create a new staff account (MANAGER, CASHIER, or WAITER) with optional profile avatar.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                profileImage: { type: "string", format: "binary" },
                                body: {
                                    type: "string",
                                    example: JSON.stringify({
                                        name: "David Waiter",
                                        email: "david@bistro.ch",
                                        password: "StaffPassword123!",
                                        staffRole: "WAITER",
                                        phone: "+41791112233",
                                    }),
                                },
                            },
                        },
                    },
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["name", "email", "password", "staffRole"],
                            properties: {
                                name: { type: "string", example: "David Waiter" },
                                email: { type: "string", format: "email", example: "david@bistro.ch" },
                                password: { type: "string", example: "StaffPassword123!" },
                                staffRole: { type: "string", enum: ["MANAGER", "CASHIER", "WAITER"], example: "WAITER" },
                                phone: { type: "string", example: "+41791112233" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Staff account created successfully" },
                400: { description: "Missing required fields or duplicate email" },
            },
        },
        get: {
            tags: ["Users & Staff"],
            summary: "Get restaurant staff members (Restaurant Owner / Admin)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "search", schema: { type: "string" } },
            ],
            responses: {
                200: {
                    description: "List of staff members",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/User" },
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

    "/users/staff/toggle-all-login": {
        patch: {
            tags: ["Users & Staff"],
            summary: "Toggle login access for all staff (Restaurant Owner / Admin)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["enableLogin"],
                            properties: {
                                enableLogin: { type: "boolean", example: true },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "All staff login status updated successfully" },
            },
        },
    },

    "/users/staff/{staffId}/toggle-login": {
        patch: {
            tags: ["Users & Staff"],
            summary: "Toggle single staff login permission",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "staffId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Staff login status toggled successfully" },
            },
        },
    },

    "/users/staff/{staffId}/password": {
        patch: {
            tags: ["Users & Staff"],
            summary: "Change staff password (Restaurant Owner / Admin)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "staffId", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["newPassword"],
                            properties: {
                                newPassword: { type: "string", example: "NewStaffPass123!" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Staff password changed successfully" },
            },
        },
    },

    "/users/staff/{staffId}": {
        patch: {
            tags: ["Users & Staff"],
            summary: "Update staff details & role",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "staffId", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                profileImage: { type: "string", format: "binary" },
                                body: {
                                    type: "string",
                                    example: JSON.stringify({
                                        name: "David Updated",
                                        phone: "+41791119988",
                                        staffRole: "MANAGER",
                                    }),
                                },
                            },
                        },
                    },
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                phone: { type: "string" },
                                staffRole: { type: "string", enum: ["MANAGER", "CASHIER", "WAITER"] },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Staff details updated successfully" },
            },
        },
    },

    "/users/stats": {
        get: {
            tags: ["Users & Staff"],
            summary: "Get platform user analytics (Admin only)",
            description: "Returns counts for total users, regular consumers, influencers, restaurant owners, and active subscriptions.",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "User statistics retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "object",
                                        properties: {
                                            totalUsers: { type: "number", example: 1250 },
                                            regularUsers: { type: "number", example: 1100 },
                                            influencerUsers: { type: "number", example: 45 },
                                            owners: { type: "number", example: 105 },
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

    "/users": {
        get: {
            tags: ["Users & Staff"],
            summary: "List all users with filters (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "search", schema: { type: "string" }, description: "Search by name, email, or phone" },
                { in: "query", name: "role", schema: { type: "string", enum: ["ADMIN", "RESTAURANT_OWNER", "USER", "STAFF"] } },
                { in: "query", name: "isInfluencer", schema: { type: "boolean" } },
                { in: "query", name: "isActive", schema: { type: "boolean" } },
            ],
            responses: {
                200: {
                    description: "Paginated users",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/User" },
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

    "/users/{id}/activity": {
        get: {
            tags: ["Users & Staff"],
            summary: "Get comprehensive user activity feed (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "User activity retrieved successfully" },
            },
        },
    },

    "/users/{id}/edit": {
        patch: {
            tags: ["Users & Staff"],
            summary: "Update user affiliate/influencer settings (Admin only)",
            description: "Modify influencer badge, customized commission percentage, max payout cap, and duration.",
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
                            properties: {
                                isInfluencer: { type: "boolean", example: true },
                                commissionPercentage: { type: "number", example: 15 },
                                maxPayout: { type: "number", example: 1000 },
                                commissionDuration: { type: "number", example: 12 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "User commission settings updated successfully" },
            },
        },
    },

    "/users/{id}/toggle-status": {
        patch: {
            tags: ["Users & Staff"],
            summary: "Activate / Deactivate user account (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "User status toggled successfully" },
            },
        },
    },

    "/users/{id}/activity-summary": {
        get: {
            tags: ["Users & Staff"],
            summary: "Get summary totals of user activity (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "User activity summary retrieved successfully" },
            },
        },
    },

    "/users/{id}/referrals": {
        get: {
            tags: ["Users & Staff"],
            summary: "Get user's referrals list (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 5 } },
            ],
            responses: {
                200: { description: "User referrals retrieved" },
            },
        },
    },

    "/users/{id}/commissions": {
        get: {
            tags: ["Users & Staff"],
            summary: "Get user's commissions list (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 5 } },
            ],
            responses: {
                200: { description: "User commissions retrieved" },
            },
        },
    },

    "/users/{id}/withdrawals": {
        get: {
            tags: ["Users & Staff"],
            summary: "Get user's payout requests history (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 5 } },
            ],
            responses: {
                200: { description: "User withdrawals history retrieved" },
            },
        },
    },

    "/users/{id}/subscriptions": {
        get: {
            tags: ["Users & Staff"],
            summary: "Get user's subscription records (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 5 } },
            ],
            responses: {
                200: { description: "User subscriptions retrieved" },
            },
        },
    },
};

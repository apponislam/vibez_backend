export const engagementPaths = {
    // Reviews
    "/reviews": {
        get: {
            tags: ["Customer Reviews"],
            summary: "Get restaurant customer reviews (Public)",
            parameters: [
                { in: "query", name: "restaurantId", schema: { type: "string" }, required: false },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "Reviews retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Review" },
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
            tags: ["Customer Reviews"],
            summary: "Submit a new restaurant review",
            description: "Allows customers to rate (1-5), comment, and attach photos after a dining experience.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["body"],
                            properties: {
                                reviewImages: {
                                    type: "array",
                                    items: { type: "string", format: "binary" },
                                    description: "Review photos (up to 10 images)",
                                },
                                body: {
                                    type: "object",
                                    description: "Review details (sent as JSON in FormData)",
                                    required: ["restaurantId", "rating"],
                                    properties: {
                                        restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
                                        rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                                        comment: { type: "string", example: "Delicious pizza and great vibe!" },
                                        reservationId: { type: "string", example: "6622bcaff993d0319ca70f50" },
                                    },
                                },
                            },
                        },
                        encoding: {
                            body: {
                                contentType: "application/json",
                            },
                        },
                    },
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["restaurantId", "rating"],
                            properties: {
                                restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
                                rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                                comment: { type: "string", example: "Great food and service!" },
                                reservationId: { type: "string", example: "6622bcaff993d0319ca70f50" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Review created successfully" },
            },
        },
    },

    "/reviews/{reviewId}": {
        get: {
            tags: ["Customer Reviews"],
            summary: "Get review by ID",
            parameters: [
                { in: "path", name: "reviewId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Review details" },
            },
        },
        patch: {
            tags: ["Customer Reviews"],
            summary: "Update own review",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "reviewId", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                reviewImages: { type: "array", items: { type: "string", format: "binary" }, description: "Optional new images" },
                                body: {
                                    type: "object",
                                    description: "Review update fields (sent as JSON in FormData)",
                                    properties: {
                                        rating: { type: "number", minimum: 1, maximum: 5, example: 4 },
                                        comment: { type: "string", example: "Updated review comment." },
                                    },
                                },
                            },
                        },
                        encoding: {
                            body: {
                                contentType: "application/json",
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Review updated" },
            },
        },
        delete: {
            tags: ["Customer Reviews"],
            summary: "Delete own review",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "reviewId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Review deleted" },
            },
        },
    },

    "/reviews/admin/all": {
        get: {
            tags: ["Customer Reviews"],
            summary: "List all reviews for moderation (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: { description: "Admin reviews list" },
            },
        },
    },

    "/reviews/{reviewId}/toggle-status": {
        patch: {
            tags: ["Customer Reviews"],
            summary: "Toggle review visibility/moderation status (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "reviewId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Review status toggled" },
            },
        },
    },

    // Shorts & Video Reels
    "/shorts/random": {
        get: {
            tags: ["Shorts & Reels"],
            summary: "Get random discovery feed of short food videos",
            description: "Fetches short reels for endless swipe food discovery.",
            parameters: [
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "Random shorts list",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Shorts" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/shorts/restaurant/{restaurantId}": {
        get: {
            tags: ["Shorts & Reels"],
            summary: "Get shorts uploaded by a specific restaurant",
            parameters: [
                { in: "path", name: "restaurantId", required: true, schema: { type: "string" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: { description: "Restaurant shorts retrieved" },
            },
        },
    },

    "/shorts/{shortId}/share": {
        post: {
            tags: ["Shorts & Reels"],
            summary: "Increment video share counter",
            parameters: [
                { in: "path", name: "shortId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Share count incremented" },
            },
        },
    },

    "/shorts/my-short": {
        get: {
            tags: ["Shorts & Reels"],
            summary: "Get current restaurant's uploaded shorts",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Owner's shorts retrieved" },
            },
        },
    },

    "/shorts/upload": {
        post: {
            tags: ["Shorts & Reels"],
            summary: "Upload a short video clip (Restaurant Owner)",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["short"],
                            properties: {
                                short: { type: "string", format: "binary", description: "Video file (mp4, webm, mov)" },
                                restaurantId: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "Short video uploaded successfully" },
            },
        },
    },

    "/shorts": {
        delete: {
            tags: ["Shorts & Reels"],
            summary: "Delete short video (Restaurant Owner)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "shortId", schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Short video deleted" },
            },
        },
    },

    "/shorts/{shortId}/toggle-save": {
        post: {
            tags: ["Shorts & Reels"],
            summary: "Bookmark / save short video (User)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "shortId", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Short saved/unsaved status toggled" },
            },
        },
    },

    // Favorites
    "/favorites": {
        get: {
            tags: ["Favorites & Bookmarks"],
            summary: "Get user's favorite restaurants list",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "Favorite restaurants",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Favorite" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/favorites/count": {
        get: {
            tags: ["Favorites & Bookmarks"],
            summary: "Get count of favorite restaurants",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "Favorites count",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { type: "number", example: 8 },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/favorites/toggle": {
        post: {
            tags: ["Favorites & Bookmarks"],
            summary: "Toggle favorite restaurant status",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["restaurantId"],
                            properties: {
                                restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Favorite status toggled" },
            },
        },
    },

    // Saved Deals
    "/saved-deals": {
        get: {
            tags: ["Favorites & Bookmarks"],
            summary: "Get user's saved/bookmarked promotional deals",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "Saved deals list",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/SavedDeal" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/saved-deals/count": {
        get: {
            tags: ["Favorites & Bookmarks"],
            summary: "Get count of saved deals",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "Saved deals count",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { type: "number", example: 3 },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/saved-deals/toggle": {
        post: {
            tags: ["Favorites & Bookmarks"],
            summary: "Toggle save/unsave deal status",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["dealId"],
                            properties: {
                                dealId: { type: "string", example: "66219800f993d0319ca70e12" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Saved deal status toggled" },
            },
        },
    },
};

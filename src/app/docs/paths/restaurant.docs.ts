export const restaurantPaths = {
    "/restaurants": {
        get: {
            tags: ["Restaurants"],
            summary: "Search & discover approved restaurants",
            description: "Fetches approved restaurants with rich filtering: search keyword, cuisine types, food types, restaurant types, geolocation distance filtering ($near), minimum rating, open now status, and client local time context. Attaches user favorites and active deals.",
            parameters: [
                { in: "query", name: "search", schema: { type: "string" }, description: "Keyword matching name or description" },
                { in: "query", name: "cuisineType", schema: { type: "string" }, description: "Comma-separated cuisine types (e.g. ITALIAN,SWISS_CUISINE)" },
                { in: "query", name: "foodType", schema: { type: "string" }, description: "Comma-separated food types (e.g. PIZZA,PASTA)" },
                { in: "query", name: "restaurantType", schema: { type: "string" }, description: "Comma-separated types (RESTAURANT,BAR,CAFE,BISTRO,BAKERY)" },
                { in: "query", name: "lat", schema: { type: "number" }, example: 47.3769, description: "Latitude for proximity sorting" },
                { in: "query", name: "lng", schema: { type: "number" }, example: 8.5417, description: "Longitude for proximity sorting" },
                { in: "query", name: "maxDistance", schema: { type: "number" }, example: 10, description: "Maximum distance in kilometers" },
                { in: "query", name: "minRating", schema: { type: "number" }, example: 4.5, description: "Minimum rating filter" },
                { in: "query", name: "openNow", schema: { type: "boolean" }, description: "Only return restaurants currently open" },
                { in: "query", name: "clientDay", schema: { type: "string", enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] } },
                { in: "query", name: "clientTime", schema: { type: "string", example: "19:30" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "Restaurants retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 200 },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Restaurant" },
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

    "/restaurants/map-points": {
        get: {
            tags: ["Restaurants"],
            summary: "Get lightweight map pins for interactive map",
            description: "Returns geo coordinates, name, rating, cover image, and id for high-performance map rendering.",
            responses: {
                200: {
                    description: "Map points retrieved successfully",
                },
            },
        },
    },

    "/restaurants/my/restaurant": {
        get: {
            tags: ["Restaurants"],
            summary: "Get logged-in owner's restaurant profile",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "Owner restaurant retrieved",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/Restaurant" },
                                },
                            },
                        },
                    },
                },
            },
        },
        patch: {
            tags: ["Restaurants"],
            summary: "Update restaurant profile (Owner)",
            description: "Updates restaurant information, opening hours, cuisine types, food types, cover image, or gallery images.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                restaurantImage: { type: "string", format: "binary", description: "Optional new cover banner (JPG, PNG, WEBP)" },
                                restaurantImages: {
                                    type: "array",
                                    items: { type: "string", format: "binary" },
                                    description: "Optional new gallery images to add",
                                },
                                body: {
                                    type: "object",
                                    description: "Restaurant update fields (sent as JSON in FormData)",
                                    properties: {
                                        restaurantName: { type: "string", example: "Vibez Gourmet Bistro" },
                                        restaurantDescription: { type: "string", example: "Updated description of our bistro." },
                                        restaurantWebsite: { type: "string", example: "https://vibezbistro.ch" },
                                        cuisineType: { type: "array", items: { type: "string" }, example: ["ITALIAN", "SWISS_CUISINE"] },
                                        foodType: { type: "array", items: { type: "string" }, example: ["PASTA", "PIZZA"] },
                                        restaurantOpenHours: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    day: { type: "string", example: "WEDNESDAY" },
                                                    isOpen: { type: "boolean", example: true },
                                                    slots: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", example: "LUNCH" },
                                                                openTime: { type: "string", example: "11:30" },
                                                                closeTime: { type: "string", example: "14:30" },
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
                        encoding: {
                            body: {
                                contentType: "application/json",
                            },
                        },
                    },
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                restaurantName: { type: "string" },
                                restaurantDescription: { type: "string" },
                                restaurantWebsite: { type: "string" },
                                cuisineType: { type: "array", items: { type: "string" } },
                                foodType: { type: "array", items: { type: "string" } },
                                restaurantOpenHours: { type: "array", items: { type: "object" } },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Restaurant updated successfully" },
            },
        },
    },

    "/restaurants/{id}": {
        get: {
            tags: ["Restaurants"],
            summary: "Get restaurant details by ID",
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: {
                    description: "Restaurant details",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/Restaurant" },
                                },
                            },
                        },
                    },
                },
                404: { description: "Restaurant not found" },
            },
        },
        delete: {
            tags: ["Restaurants"],
            summary: "Delete restaurant (Admin / Owner)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Restaurant deleted successfully" },
            },
        },
    },

    "/restaurants/admin/all": {
        get: {
            tags: ["Restaurants"],
            summary: "List all restaurants including unapproved (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "search", schema: { type: "string" } },
                { in: "query", name: "approved", schema: { type: "boolean" } },
            ],
            responses: {
                200: { description: "Admin restaurant list" },
            },
        },
    },

    "/restaurants/admin/pending": {
        get: {
            tags: ["Restaurants"],
            summary: "List pending restaurant approval requests (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
                { in: "query", name: "search", schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Pending restaurants" },
            },
        },
    },

    "/restaurants/admin/{id}": {
        patch: {
            tags: ["Restaurants"],
            summary: "Update any restaurant profile (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Restaurant updated by admin" },
            },
        },
    },

    "/restaurants/{id}/approve": {
        patch: {
            tags: ["Restaurants"],
            summary: "Approve restaurant profile (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Restaurant approved successfully" },
            },
        },
    },

    "/restaurants/{id}/revoke-approval": {
        patch: {
            tags: ["Restaurants"],
            summary: "Revoke restaurant approval (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Restaurant approval revoked" },
            },
        },
    },
};

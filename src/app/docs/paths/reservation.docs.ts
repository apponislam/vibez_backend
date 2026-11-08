export const reservationPaths = {
    "/reservations/check-status": {
        post: {
            tags: ["Reservations"],
            summary: "Check if user can claim/book a deal",
            description: "Verifies if user has an existing active booking or daily claim limit reached for the specified deal.",
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
                200: { description: "Claim status checked" },
            },
        },
    },

    "/reservations": {
        post: {
            tags: ["Reservations"],
            summary: "Create a restaurant table reservation with deal",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["restaurantId", "dealId", "partySize", "reservationDate", "reservationTime"],
                            properties: {
                                restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
                                dealId: { type: "string", example: "66219800f993d0319ca70e12" },
                                partySize: { type: "integer", minimum: 1, maximum: 20, example: 2 },
                                reservationDate: { type: "string", format: "date", example: "2026-11-12" },
                                reservationTime: { type: "string", example: "19:30" },
                                specialRequests: { type: "string", example: "Quiet corner table please" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Reservation created successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 201 },
                                    data: { $ref: "#/components/schemas/Reservation" },
                                },
                            },
                        },
                    },
                },
                400: { description: "Invalid booking time, day mismatch, or claim limit exceeded" },
            },
        },
        get: {
            tags: ["Reservations"],
            summary: "Get all reservations (Admin / Owner / Staff)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "status", schema: { type: "string", enum: ["UPCOMING", "ARRIVED", "COMPLETED", "EXPIRED", "CANCELLED"] } },
                { in: "query", name: "restaurantId", schema: { type: "string" } },
                { in: "query", name: "date", schema: { type: "string", format: "date" } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "List of reservations",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Reservation" },
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

    "/reservations/my": {
        get: {
            tags: ["Reservations"],
            summary: "Get customer's personal reservations",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "query", name: "status", schema: { type: "string", enum: ["UPCOMING", "ARRIVED", "COMPLETED", "EXPIRED", "CANCELLED"] } },
                { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
            ],
            responses: {
                200: {
                    description: "User reservations list",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/Reservation" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/reservations/stats": {
        get: {
            tags: ["Reservations"],
            summary: "Get general reservation statistics",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Reservation statistics" },
            },
        },
    },

    "/reservations/owner-stats": {
        get: {
            tags: ["Reservations"],
            summary: "Get restaurant owner reservation stats",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Owner reservation stats" },
            },
        },
    },

    "/reservations/weekly-bookings": {
        get: {
            tags: ["Reservations"],
            summary: "Get weekly booking numbers (Admin only)",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Weekly booking numbers" },
            },
        },
    },

    "/reservations/{id}": {
        get: {
            tags: ["Reservations"],
            summary: "Get reservation details by ID",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: {
                    description: "Reservation details",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    data: { $ref: "#/components/schemas/Reservation" },
                                },
                            },
                        },
                    },
                },
            },
        },
        patch: {
            tags: ["Reservations"],
            summary: "Update reservation details",
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
                                partySize: { type: "integer" },
                                reservationDate: { type: "string", format: "date" },
                                reservationTime: { type: "string" },
                                specialRequests: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Reservation updated" },
            },
        },
        delete: {
            tags: ["Reservations"],
            summary: "Cancel/Delete reservation",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "id", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Reservation cancelled" },
            },
        },
    },

    "/reservations/{id}/status": {
        patch: {
            tags: ["Reservations"],
            summary: "Update reservation status (ARRIVED, COMPLETED, CANCELLED)",
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
                            required: ["status"],
                            properties: {
                                status: {
                                    type: "string",
                                    enum: ["UPCOMING", "ARRIVED", "COMPLETED", "EXPIRED", "CANCELLED"],
                                    example: "ARRIVED",
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Reservation status updated" },
            },
        },
    },
};

export const openApiSchemas = {
    User: {
        type: "object",
        properties: {
            _id: { type: "string", example: "661f43a9f993d0319ca70b21" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "user@vibez.com" },
            role: { type: "string", enum: ["ADMIN", "RESTAURANT_OWNER", "USER", "STAFF"], example: "USER" },
            staffRole: { type: "string", enum: ["MANAGER", "CASHIER", "WAITER"], example: "WAITER" },
            restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
            phone: { type: "string", example: "+41791234567" },
            profileImage: { type: "string", example: "/uploads/profile-images/profile-1234.webp" },
            location: {
                type: "object",
                properties: {
                    lat: { type: "number", example: 47.3769 },
                    lng: { type: "number", example: 8.5417 },
                },
            },
            language: { type: "string", example: "en" },
            aboutme: { type: "string", example: "Food lover and weekend explorer." },
            address: {
                type: "object",
                properties: {
                    street: { type: "string", example: "Bahnhofstrasse 10" },
                    city: { type: "string", example: "Zurich" },
                    state: { type: "string", example: "ZH" },
                    zipCode: { type: "string", example: "8001" },
                    country: { type: "string", example: "Switzerland" },
                },
            },
            isActive: { type: "boolean", example: true },
            isEmailVerified: { type: "boolean", example: true },
            isInfluencer: { type: "boolean", example: false },
            isNewUser: { type: "boolean", example: false },
            balance: { type: "number", example: 120.5 },
            commissionPercentage: { type: "number", example: 10 },
            maxPayout: { type: "number", example: 500 },
            commissionDuration: { type: "number", example: 12 },
            favoriteCuisines: { type: "array", items: { type: "string" }, example: ["ITALIAN", "JAPANESE"] },
            dietaryPreferences: { type: "array", items: { type: "string" }, example: ["VEGETARIAN"] },
            referralCode: { type: "string", example: "VBZ-98210" },
            referredBy: { type: "string", example: "661f43a9f993d0319ca70b20" },
            enableStaffLogin: { type: "boolean", example: true },
            subscriptionPlanId: { type: "string", example: "661fa1c2f993d0319ca70c99" },
            subscriptionEndDate: { type: "string", format: "date-time", example: "2026-12-31T23:59:59.000Z" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    RegisterUserInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
            name: {
                type: "string",
                example: "John Doe",
                description: "Full legal or display name of the user (Required)",
            },
            email: {
                type: "string",
                format: "email",
                example: "john.doe@example.com",
                description: "Unique email address for user login & account verification (Required)",
            },
            password: {
                type: "string",
                format: "password",
                example: "StrongPassword123!",
                description: "User password with minimum 6 characters (Required)",
            },
            role: {
                type: "string",
                enum: ["USER", "RESTAURANT_OWNER"],
                default: "USER",
                example: "USER",
                description: "Platform role ('USER' for regular consumers/diners, 'RESTAURANT_OWNER' for managers). Default: 'USER'.",
            },
            phone: {
                type: "string",
                example: "+41791234567",
                description: "Contact phone number with international country code (Optional)",
            },
            referredByCode: {
                type: "string",
                example: "VBZ-98210",
                description: "Optional referral invite code if this user was invited by an existing user/influencer. ⚠️ NOTE: Never send 'referralCode' or 'balance'. The backend automatically generates a unique referral code and initializes balance to 0.",
            },
            location: {
                type: "object",
                description: "User's current GPS location coordinates (Optional)",
                properties: {
                    lat: { type: "number", example: 47.3769, description: "Latitude" },
                    lng: { type: "number", example: 8.5417, description: "Longitude" },
                },
            },
            preferences: {
                type: "array",
                items: { type: "string" },
                example: ["ITALIAN", "SWISS"],
                description: "General dining or cuisine preferences (Optional)",
            },
        },
        example: {
            name: "John Doe",
            email: "john.doe@example.com",
            password: "StrongPassword123!",
            role: "USER",
            phone: "+41791234567",
            referredByCode: "VBZ-98210",
            location: {
                lat: 47.3769,
                lng: 8.5417,
            },
            preferences: ["ITALIAN", "SWISS"],
        },
    },

    Restaurant: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66207b81f993d0319ca70d44" },
            restaurantName: { type: "string", example: "Vibez Gourmet Bistro" },
            restaurantDescription: { type: "string", example: "Authentic Mediterranean & Swiss fusion culinary experience." },
            restaurantType: {
                type: "string",
                enum: ["RESTAURANT", "BAR", "BISTRO", "CAFE", "BAKERY"],
                example: "RESTAURANT",
            },
            cuisineType: {
                type: "array",
                items: {
                    type: "string",
                    enum: [
                        "AMERICAN", "ITALIAN", "SWISS_CUISINE", "INDIAN", "CHINESE",
                        "THAI", "VIETNAMESE", "TURKISH", "MEXICAN", "FRENCH",
                        "JAPANESE", "SPANISH", "GREEK", "LEBANESE", "BRAZILIAN",
                    ],
                },
                example: ["ITALIAN", "SWISS_CUISINE"],
            },
            foodType: {
                type: "array",
                items: {
                    type: "string",
                    enum: [
                        "PIZZA", "BURGER", "SUSHI", "PASTA", "MEAT",
                        "FISH", "SEAFOOD", "KEBAB", "VEGAN", "VEGETARIAN",
                    ],
                },
                example: ["PASTA", "PIZZA"],
            },
            restaurantOwner: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    name: { type: "string", example: "Mario Rossi" },
                    email: { type: "string", example: "mario@bistro.com" },
                    phone: { type: "string", example: "+41790001122" },
                },
            },
            restaurantWebsite: { type: "string", example: "https://vibezbistro.ch" },
            restaurantAddress: {
                type: "object",
                properties: {
                    street: { type: "string", example: "Limmatquai 42" },
                    city: { type: "string", example: "Zurich" },
                    state: { type: "string", example: "ZH" },
                    zipCode: { type: "string", example: "8001" },
                    country: { type: "string", example: "Switzerland" },
                    location: {
                        type: "object",
                        properties: {
                            type: { type: "string", example: "Point" },
                            coordinates: {
                                type: "array",
                                items: { type: "number" },
                                example: [8.5417, 47.3769],
                                description: "[Longitude, Latitude]",
                            },
                        },
                    },
                },
            },
            restaurantOpenHours: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        day: {
                            type: "string",
                            enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
                            example: "WEDNESDAY",
                        },
                        isOpen: { type: "boolean", example: true },
                        slots: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["LUNCH", "DINNER"], example: "LUNCH" },
                                    openTime: { type: "string", example: "11:30" },
                                    closeTime: { type: "string", example: "14:30" },
                                },
                            },
                        },
                    },
                },
            },
            restaurantImage: { type: "string", example: "/uploads/restaurant-images/main-9812.webp" },
            restaurantImages: {
                type: "array",
                items: { type: "string" },
                example: [
                    "/uploads/restaurant-images/gallery-1.webp",
                    "/uploads/restaurant-images/gallery-2.webp",
                ],
            },
            approved: { type: "boolean", example: true },
            rating: { type: "number", example: 4.8 },
            reviewCount: { type: "number", example: 42 },
            isFavorite: { type: "boolean", example: false },
            recentDeals: {
                type: "array",
                items: { $ref: "#/components/schemas/Deal" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Deal: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66219800f993d0319ca70e12" },
            restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
            dealType: {
                type: "string",
                enum: ["TWO_FOR_ONE", "FREE_ITEM", "PERCENT_DISCOUNT", "FIXED_DISCOUNT"],
                example: "TWO_FOR_ONE",
            },
            title: { type: "string", example: "2-for-1 Main Courses Every Wednesday" },
            description: { type: "string", example: "Enjoy two main courses for the price of one during lunch and dinner." },
            day: {
                type: "array",
                items: {
                    type: "string",
                    enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
                },
                example: ["WEDNESDAY"],
            },
            mealTime: { type: "string", enum: ["LUNCH", "DINNER"], example: "LUNCH" },
            resturantHours: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        day: { type: "string", example: "WEDNESDAY" },
                        start: { type: "string", example: "11:30" },
                        end: { type: "string", example: "14:30" },
                    },
                },
            },
            maxClaimsPerDay: { type: "number", example: 15 },
            isActive: { type: "boolean", example: true },
            twoForOne: {
                type: "object",
                properties: {
                    appliesTo: {
                        type: "string",
                        enum: ["MAIN_COURSE", "DRINKS", "DESSERTS", "STARTERS"],
                        example: "MAIN_COURSE",
                    },
                },
            },
            freeItem: {
                type: "object",
                properties: {
                    buy: {
                        type: "string",
                        enum: ["MAIN_COURSE", "MENU", "MAIN_COURSE_PLUS_DRINK"],
                        example: "MAIN_COURSE",
                    },
                    get: {
                        type: "string",
                        enum: ["DRINK", "DESSERT", "STARTER"],
                        example: "DRINK",
                    },
                },
            },
            percentDiscount: {
                type: "object",
                properties: {
                    percentage: { type: "number", enum: [10, 15, 20, 30], example: 20 },
                    appliesTo: {
                        type: "string",
                        enum: ["ENTIRE_ORDER", "CATEGORY"],
                        example: "ENTIRE_ORDER",
                    },
                    category: {
                        type: "string",
                        enum: ["MAIN_COURSE", "MENU", "DRINKS"],
                        example: "MAIN_COURSE",
                    },
                },
            },
            fixedDiscount: {
                type: "object",
                properties: {
                    minSpend: { type: "number", example: 50 },
                    amount: { type: "number", example: 10 },
                },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Reservation: {
        type: "object",
        properties: {
            _id: { type: "string", example: "6622bcaff993d0319ca70f50" },
            restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
            userId: { type: "string", example: "661f43a9f993d0319ca70b21" },
            dealId: { type: "string", example: "66219800f993d0319ca70e12" },
            partySize: { type: "number", example: 2 },
            reservationDate: { type: "string", format: "date", example: "2026-11-12" },
            reservationTime: { type: "string", example: "19:30" },
            specialRequests: { type: "string", example: "Table near the window please" },
            status: {
                type: "string",
                enum: ["UPCOMING", "ARRIVED", "COMPLETED", "EXPIRED", "CANCELLED"],
                example: "UPCOMING",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    SavedDeal: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66230111f993d0319ca71001" },
            userId: { type: "string", example: "661f43a9f993d0319ca70b21" },
            dealId: { $ref: "#/components/schemas/Deal" },
            isUsed: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Favorite: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66240222f993d0319ca71002" },
            userId: { type: "string", example: "661f43a9f993d0319ca70b21" },
            restaurantId: { $ref: "#/components/schemas/Restaurant" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Review: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66250333f993d0319ca71003" },
            restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
            userId: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    name: { type: "string", example: "Sophia Meier" },
                    profileImage: { type: "string", example: "/uploads/profile-images/sophia.webp" },
                },
            },
            rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
            comment: { type: "string", example: "Amazing food and wonderful service! Highly recommend the pasta." },
            reservationId: { type: "string", example: "6622bcaff993d0319ca70f50" },
            images: {
                type: "array",
                items: { type: "string" },
                example: ["/uploads/review-images/rev-1.webp"],
            },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Shorts: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66260444f993d0319ca71004" },
            restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
            shortUrl: { type: "string", example: "/uploads/shorts/reel-chef-dish.mp4" },
            isActive: { type: "boolean", example: true },
            shareCount: { type: "number", example: 128 },
            saveCount: { type: "number", example: 45 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    SubscriptionPlan: {
        type: "object",
        properties: {
            _id: { type: "string", example: "661fa1c2f993d0319ca70c99" },
            name: { type: "string", example: "VIBEZ Premium VIP Monthly" },
            price: { type: "number", example: 8.9 },
            duration: {
                type: "string",
                enum: ["MONTHLY", "HALF_YEARLY", "YEARLY", "TWO_YEARLY"],
                example: "MONTHLY",
            },
            isFreeTrial: { type: "boolean", example: true },
            freeTrialDays: { type: "number", example: 14 },
            stripeProductId: { type: "string", example: "prod_Q7aB89..." },
            stripePriceId: { type: "string", example: "price_1Ov9..." },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    UserSubscription: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66270555f993d0319ca71005" },
            userId: { type: "string", example: "661f43a9f993d0319ca70b21" },
            subscriptionPlanId: { $ref: "#/components/schemas/SubscriptionPlan" },
            stripeSubscriptionId: { type: "string", example: "sub_1UDiqH8h9B550zBaevKdT7Vk" },
            stripeCustomerId: { type: "string", example: "cus_VEAfjlYwgChQxm" },
            status: {
                type: "string",
                enum: ["ACTIVE", "CANCELLED", "EXPIRED"],
                example: "ACTIVE",
            },
            startDate: { type: "string", format: "date-time", example: "2026-11-01T00:00:00.000Z" },
            endDate: { type: "string", format: "date-time", example: "2026-12-01T00:00:00.000Z" },
            isTrial: { type: "boolean", example: false },
            percentOff: { type: "number", example: 10 },
            amountOff: { type: "number", example: 0 },
            actualPrice: { type: "number", example: 8.9 },
            paidPrice: { type: "number", example: 8.01 },
            commissionAmount: { type: "number", example: 0.8 },
            commissionUser: { type: "string", example: "661f43a9f993d0319ca70b20" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Commission: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66280666f993d0319ca71006" },
            commissionPercentage: { type: "number", example: 10 },
            maxPayout: { type: "number", example: 500 },
            commissionDuration: { type: "number", example: 12 },
            commissionPaidCount: { type: "number", example: 3 },
            commissionUser: { $ref: "#/components/schemas/User" },
            commissionFrom: { $ref: "#/components/schemas/User" },
            subscriptionId: { type: "string", example: "sub_1UDiqH8h9B550zBaevKdT7Vk" },
            history: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        invoiceId: { type: "string", example: "in_1Ov9..." },
                        amount: { type: "number", example: 0.8 },
                        userSubscriptionId: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
            },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Withdrawal: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66290777f993d0319ca71007" },
            userId: { $ref: "#/components/schemas/User" },
            amount: { type: "number", example: 150.0 },
            status: {
                type: "string",
                enum: ["PENDING", "APPROVED", "REJECTED"],
                example: "PENDING",
            },
            paymentMethod: {
                type: "string",
                enum: ["STRIPE", "BANK"],
                example: "STRIPE",
            },
            paymentDetails: {
                type: "object",
                example: { iban: "CH9300000000000000000", accountHolder: "John Doe" },
            },
            adminFeedback: { type: "string", example: "Payout processed via Stripe Connect transfer." },
            stripeTransferId: { type: "string", example: "tr_1Ov9..." },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Coupon: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66300888f993d0319ca71008" },
            couponId: { type: "string", example: "VIBEZ2026" },
            name: { type: "string", example: "Launch Promo 20% Off" },
            percentOff: { type: "number", example: 20 },
            amountOff: { type: "number", example: 0 },
            currency: { type: "string", example: "chf" },
            duration: { type: "string", enum: ["once", "repeating", "forever"], example: "once" },
            durationInMonths: { type: "number", example: 1 },
            isDefault: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            maxRedemptions: { type: "number", example: 500 },
            timesRedeemed: { type: "number", example: 42 },
            isDirectUse: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    PromoCode: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66310999f993d0319ca71009" },
            code: { type: "string", example: "SUMMERVIBEZ" },
            discountPercentage: { type: "number", example: 15 },
            maxDiscountAmount: { type: "number", example: 25 },
            minOrderAmount: { type: "number", example: 40 },
            isActive: { type: "boolean", example: true },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            usageLimit: { type: "number", example: 200 },
            usageCount: { type: "number", example: 35 },
            restaurantId: { type: "string", example: "66207b81f993d0319ca70d44" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    FAQ: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66320aaaf993d0319ca71010" },
            question: { type: "string", example: "How do 2-for-1 deals work at restaurants?" },
            answer: { type: "string", example: "Simply reserve a table through VIBEZ. When dining, present your active reservation to enjoy 2 meals for the price of 1." },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Notification: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66330bbbf993d0319ca71011" },
            userId: { type: "string", example: "661f43a9f993d0319ca70b21" },
            type: { type: "string", example: "RESERVATION_CONFIRMED" },
            title: { type: "string", example: "Reservation Confirmed!" },
            body: { type: "string", example: "Your reservation at Vibez Bistro is confirmed for Nov 12 at 19:30." },
            data: {
                type: "object",
                additionalProperties: { type: "string" },
                example: { reservationId: "6622bcaff993d0319ca70f50" },
            },
            isRead: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Settings: {
        type: "object",
        properties: {
            _id: { type: "string", example: "66340cccf993d0319ca71012" },
            defaultMaxPayout: { type: "number", example: 1000 },
            defaultCommisionPercentage: { type: "number", example: 15 },
            defaultCommissionDuration: { type: "number", example: 12 },
            emailNotification: { type: "boolean", example: true },
            pushNotification: { type: "boolean", example: true },
            allowAutoApproveNewResturant: { type: "boolean", example: false },
            allowAutoApproveResturantDeals: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
        },
    },

    Policy: {
        type: "object",
        properties: {
            type: {
                type: "string",
                enum: ["terms-and-conditions", "privacy-policy", "refund-policy"],
                example: "privacy-policy",
            },
            title: { type: "string", example: "Privacy Policy" },
            content: { type: "string", example: "<h3>1. Information Collection</h3><p>We respect your privacy...</p>" },
            publishedAt: { type: "string", format: "date-time" },
        },
    },

    ApiResponse: {
        type: "object",
        properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "number", example: 200 },
            message: { type: "string", example: "Operation executed successfully" },
            data: { type: "object" },
            meta: {
                type: "object",
                properties: {
                    page: { type: "number", example: 1 },
                    limit: { type: "number", example: 10 },
                    total: { type: "number", example: 50 },
                    totalPage: { type: "number", example: 5 },
                },
            },
        },
    },

    ApiError: {
        type: "object",
        properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Resource not found or bad request" },
            errorMessages: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        path: { type: "string", example: "email" },
                        message: { type: "string", example: "Invalid email format" },
                    },
                },
            },
            stack: { type: "string" },
        },
    },
};

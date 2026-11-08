export const authPaths = {
    "/auth/register": {
        post: {
            tags: ["Authentication"],
            summary: "Register a new user account (Customer or Restaurant Owner)",
            description: `
Registers a new customer (\`USER\`), restaurant owner (\`RESTAURANT_OWNER\`), or staff member.

---

### ⚠️ IMPORTANT: Backend Rules Checked
- **Never send \`balance\`**: The server initializes \`balance: 0\`. In \`auth.services.ts\`, if \`balance\` is present in the payload, the backend explicitly deletes it (\`delete data.balance\`).
- **Never send \`referralCode\`**: The backend automatically generates and assigns a unique personal \`referralCode\` for every new user upon creation.
- **Invited by someone?** Pass the inviter's referral code in **\`referredByCode\`** (optional).
- **Other Profile Fields** (\`address\`, \`favoriteCuisines\`, \`dietaryPreferences\`, \`language\`, \`aboutme\`): Registration accepts essential account fields; full profile customization is handled after login via \`PATCH /api/v1/auth/profile\`.

---

### 📦 Request Format (\`multipart/form-data\`)
Because this endpoint accepts an optional profile image file (\`profileImage\`), the request should be submitted as **\`multipart/form-data\`** with:
1. **\`profileImage\`** *(File, optional)*: Image file (\`.jpeg\`, \`.png\`, \`.webp\`)
2. **\`body\`** *(string, required)*: **JSON-stringified** object containing the user registration data.

#### 💻 Frontend Implementation Example (Axios / Fetch):
\`\`\`javascript
const formData = new FormData();

// 1. (Optional) Attach profile avatar file
if (avatarFileInput?.files?.[0]) {
  formData.append("profileImage", avatarFileInput.files[0]);
}

// 2. Registration data payload (stringified JSON)
const userData = {
  name: "John Doe",
  email: "john.doe@example.com",
  password: "StrongPassword123!",
  role: "USER", // "USER" | "RESTAURANT_OWNER"
  phone: "+41791234567",
  referredByCode: "VBZ-98210", // Optional: only if invited by a friend/affiliate
  location: {
    lat: 47.3769,
    lng: 8.5417
  },
  preferences: ["ITALIAN", "SWISS"] // Optional
};

formData.append("body", JSON.stringify(userData));

// 3. Send request (Do NOT manually set Content-Type header; Axios/browser sets multipart boundary automatically)
const response = await axios.post("/api/v1/auth/register", formData);
\`\`\`
            `,
            requestBody: {
                required: true,
                description: "Registration payload. In multipart/form-data, provide `profileImage` (binary file) and `body` (JSON string containing full user registration details conforming to RegisterUserInput).",
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["body"],
                            properties: {
                                profileImage: {
                                    type: "string",
                                    format: "binary",
                                    description: "Optional profile avatar image (JPEG, PNG, WEBP)",
                                },
                                body: {
                                    $ref: "#/components/schemas/RegisterUserInput",
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
                            $ref: "#/components/schemas/RegisterUserInput",
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "User registered successfully. Returns user profile, access token, and refresh token.",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 201 },
                                    message: { type: "string", example: "User registered successfully" },
                                    data: {
                                        type: "object",
                                        properties: {
                                            user: { $ref: "#/components/schemas/User" },
                                            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." },
                                            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: {
                    description: "Bad Request: Validation error (e.g. missing name/email/password or invalid format), or email already registered.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponse" },
                            example: {
                                success: false,
                                message: "Email already registered. Please sign in.",
                                errorSources: [{ path: "email", message: "Email already registered. Please sign in." }],
                            },
                        },
                    },
                },
            },
        },
    },

    "/auth/register-restaurant": {
        post: {
            tags: ["Authentication"],
            summary: "Register restaurant owner and create restaurant profile",
            description: `
Registers a new restaurant owner account while simultaneously creating the associated restaurant profile and uploading restaurant cover/gallery images.

#### 💡 Frontend Integration Guide (\`FormData\` with files + JSON \`body\`):
\`\`\`javascript
const formData = new FormData();

// 1. Files
if (avatarFile) formData.append("profileImage", avatarFile);
if (coverFile) formData.append("restaurantImage", coverFile);
galleryFiles.forEach(file => formData.append("restaurantImages", file));

// 2. Data payload as JSON-stringified 'body'
formData.append("body", JSON.stringify({
  name: "Chef Mario",
  email: "mario@bistro.ch",
  password: "SecurePassword123!",
  phone: "+41791234567",
  restaurantName: "Mario's Italian Trattoria",
  restaurantDescription: "Wood-fired authentic pizzas and handmade pasta in Zurich.",
  restaurantType: "RESTAURANT",
  cuisineType: ["ITALIAN"],
  foodType: ["PIZZA", "PASTA"],
  restaurantWebsite: "https://mariosbistro.ch",
  restaurantAddress: {
    street: "Seestrasse 14",
    city: "Zurich",
    state: "ZH",
    zipCode: "8002",
    country: "Switzerland"
  },
  restaurantOpenHours: [
    {
      day: "WEDNESDAY",
      isOpen: true,
      slots: [{ type: "DINNER", openTime: "18:00", closeTime: "23:00" }]
    }
  ]
}));

await axios.post("/api/v1/auth/register-restaurant", formData);
\`\`\`
            `,
            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["body"],
                            properties: {
                                profileImage: { type: "string", format: "binary", description: "Owner profile avatar (JPG, PNG, WEBP)" },
                                restaurantImage: { type: "string", format: "binary", description: "Restaurant cover image (JPG, PNG, WEBP)" },
                                restaurantImages: {
                                    type: "array",
                                    items: { type: "string", format: "binary" },
                                    description: "Restaurant gallery images (up to 20 images)",
                                },
                                body: {
                                    type: "object",
                                    description: "Restaurant profile & Owner account details (sent as JSON in FormData)",
                                    required: ["name", "email", "password", "restaurantName", "restaurantType", "cuisineType", "restaurantAddress"],
                                    properties: {
                                        name: { type: "string", example: "Chef Mario", description: "Owner full name" },
                                        email: { type: "string", format: "email", example: "mario@bistro.ch", description: "Owner login email" },
                                        password: { type: "string", example: "SecurePassword123!", description: "Owner password" },
                                        phone: { type: "string", example: "+41791234567", description: "Owner contact phone" },
                                        restaurantName: { type: "string", example: "Mario's Italian Trattoria", description: "Restaurant name" },
                                        restaurantDescription: { type: "string", example: "Wood-fired authentic pizzas and handmade pasta in Zurich." },
                                        restaurantType: { type: "string", enum: ["RESTAURANT", "BAR", "BISTRO", "CAFE", "BAKERY"], example: "RESTAURANT" },
                                        cuisineType: { type: "array", items: { type: "string" }, example: ["ITALIAN"] },
                                        foodType: { type: "array", items: { type: "string" }, example: ["PIZZA", "PASTA"] },
                                        restaurantWebsite: { type: "string", example: "https://mariosbistro.ch" },
                                        restaurantAddress: {
                                            type: "object",
                                            properties: {
                                                street: { type: "string", example: "Seestrasse 14" },
                                                city: { type: "string", example: "Zurich" },
                                                state: { type: "string", example: "ZH" },
                                                zipCode: { type: "string", example: "8002" },
                                                country: { type: "string", example: "Switzerland" },
                                            },
                                        },
                                        restaurantOpenHours: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    day: { type: "string", enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"], example: "WEDNESDAY" },
                                                    isOpen: { type: "boolean", example: true },
                                                    slots: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                type: { type: "string", enum: ["LUNCH", "DINNER"], example: "DINNER" },
                                                                openTime: { type: "string", example: "18:00" },
                                                                closeTime: { type: "string", example: "23:00" },
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
                },
            },
            responses: {
                201: {
                    description: "Restaurant owner registered and restaurant created successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 201 },
                                    message: { type: "string", example: "Restaurant owner registered and restaurant created successfully" },
                                    data: {
                                        type: "object",
                                        properties: {
                                            user: { $ref: "#/components/schemas/User" },
                                            accessToken: { type: "string", example: "eyJhbGciOi..." },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { description: "Missing required fields or invalid data" },
            },
        },
    },

    "/auth/login": {
        post: {
            tags: ["Authentication"],
            summary: "User / Owner / Staff Login",
            description: "Authenticates any user role with email and password. Returns an access token and sets an HTTP-only refresh token cookie.",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string", format: "email", example: "user@vibez.com" },
                                password: { type: "string", example: "YourPassword123!" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Login successful",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 200 },
                                    message: { type: "string", example: "Login successful" },
                                    data: {
                                        type: "object",
                                        properties: {
                                            user: { $ref: "#/components/schemas/User" },
                                            accessToken: { type: "string", example: "eyJhbGciOi..." },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: "Invalid credentials" },
            },
        },
    },

    "/auth/verify-email": {
        get: {
            tags: ["Authentication"],
            summary: "Verify user email address",
            description: "Verifies user account via email token or 6-digit OTP code.",
            parameters: [
                { in: "query", name: "email", required: true, schema: { type: "string" }, example: "john@example.com" },
                { in: "query", name: "token", required: false, schema: { type: "string" }, example: "verification_token_here" },
                { in: "query", name: "otp", required: false, schema: { type: "string" }, example: "123456" },
            ],
            responses: {
                200: { description: "Email verified successfully" },
                400: { description: "Invalid or expired token/OTP" },
            },
        },
    },

    "/auth/resend-verification": {
        post: {
            tags: ["Authentication"],
            summary: "Resend email verification link/OTP",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email"],
                            properties: {
                                email: { type: "string", format: "email", example: "john@example.com" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Verification email resent successfully" },
            },
        },
    },

    "/auth/refresh-token": {
        post: {
            tags: ["Authentication"],
            summary: "Refresh Access Token",
            description: "Issues a new JWT access token using the refresh token from cookie or body.",
            requestBody: {
                required: false,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                refreshToken: { type: "string", example: "eyJhbGciOi..." },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Token refreshed successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 200 },
                                    message: { type: "string", example: "Token refreshed successfully" },
                                    data: {
                                        type: "object",
                                        properties: {
                                            accessToken: { type: "string", example: "eyJhbGciOi..." },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: "Invalid or expired refresh token" },
            },
        },
    },

    "/auth/forgot-password": {
        post: {
            tags: ["Authentication"],
            summary: "Request password reset OTP",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email"],
                            properties: {
                                email: { type: "string", format: "email", example: "john@example.com" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Password reset OTP sent to email" },
            },
        },
    },

    "/auth/verify-otp": {
        post: {
            tags: ["Authentication"],
            summary: "Verify password reset OTP",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "otp"],
                            properties: {
                                email: { type: "string", format: "email", example: "john@example.com" },
                                otp: { type: "string", example: "654321" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "OTP verified successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 200 },
                                    message: { type: "string", example: "OTP verified successfully" },
                                    data: {
                                        type: "object",
                                        properties: {
                                            token: { type: "string", example: "reset_token_xyz" },
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

    "/auth/resend-otp": {
        post: {
            tags: ["Authentication"],
            summary: "Resend password reset OTP",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email"],
                            properties: {
                                email: { type: "string", format: "email", example: "john@example.com" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "OTP resent successfully" },
            },
        },
    },

    "/auth/reset-password": {
        post: {
            tags: ["Authentication"],
            summary: "Reset account password with token",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["token", "newPassword"],
                            properties: {
                                token: { type: "string", example: "reset_token_xyz" },
                                newPassword: { type: "string", example: "NewStrongPassword123!" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Password reset successful" },
            },
        },
    },

    "/auth/me": {
        get: {
            tags: ["Authentication"],
            summary: "Get current logged-in user profile",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "User profile retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 200 },
                                    data: { $ref: "#/components/schemas/User" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
            },
        },
    },

    "/auth/logout": {
        post: {
            tags: ["Authentication"],
            summary: "Log out user",
            description: "Clears the HTTP-only refresh token cookie.",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Logout successful" },
            },
        },
    },

    "/auth/profile": {
        patch: {
            tags: ["Authentication"],
            summary: "Update current user profile",
            description: "Update account details (name, phone, address, dietary preferences, avatar). Supports multipart form or JSON.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                profileImage: { type: "string", format: "binary", description: "Optional new avatar image (JPG, PNG, WEBP)" },
                                body: {
                                    type: "object",
                                    description: "Profile updates (sent as JSON in FormData)",
                                    properties: {
                                        name: { type: "string", example: "Johnathan Doe" },
                                        phone: { type: "string", example: "+41791234567" },
                                        language: { type: "string", example: "de" },
                                        aboutme: { type: "string", example: "Food enthusiast" },
                                        favoriteCuisines: { type: "array", items: { type: "string" }, example: ["ITALIAN", "SWISS_CUISINE"] },
                                        dietaryPreferences: { type: "array", items: { type: "string" }, example: ["VEGETARIAN"] },
                                        address: {
                                            type: "object",
                                            properties: {
                                                street: { type: "string", example: "Limmatquai 42" },
                                                city: { type: "string", example: "Zurich" },
                                                state: { type: "string", example: "ZH" },
                                                zipCode: { type: "string", example: "8001" },
                                                country: { type: "string", example: "Switzerland" },
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
                                name: { type: "string" },
                                phone: { type: "string" },
                                language: { type: "string" },
                                aboutme: { type: "string" },
                                location: {
                                    type: "object",
                                    properties: {
                                        lat: { type: "number" },
                                        lng: { type: "number" },
                                    },
                                },
                                address: {
                                    type: "object",
                                    properties: {
                                        street: { type: "string" },
                                        city: { type: "string" },
                                        state: { type: "string" },
                                        zipCode: { type: "string" },
                                        country: { type: "string" },
                                    },
                                },
                                favoriteCuisines: { type: "array", items: { type: "string" } },
                                dietaryPreferences: { type: "array", items: { type: "string" } },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Profile updated successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    statusCode: { type: "number", example: 200 },
                                    data: { $ref: "#/components/schemas/User" },
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    "/auth/location": {
        patch: {
            tags: ["Authentication"],
            summary: "Update user live geolocation",
            description: "Updates latitude and longitude coordinates and broadcasts the new position via Socket.io.",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["lat", "lng"],
                            properties: {
                                lat: { type: "number", example: 47.3769 },
                                lng: { type: "number", example: 8.5417 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Location updated successfully" },
            },
        },
    },

    "/auth/fcm-token": {
        post: {
            tags: ["Authentication"],
            summary: "Register FCM device token for push notifications",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["token"],
                            properties: {
                                token: { type: "string", example: "fcm_token_device_string_here" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "FCM token added successfully" },
            },
        },
    },

    "/auth/change-password": {
        post: {
            tags: ["Authentication"],
            summary: "Change account password",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["currentPassword", "newPassword"],
                            properties: {
                                currentPassword: { type: "string", example: "OldPassword123!" },
                                newPassword: { type: "string", example: "BrandNewPassword123!" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Password changed successfully" },
            },
        },
    },

    "/auth/update-email": {
        post: {
            tags: ["Authentication"],
            summary: "Initiate email address change",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string", format: "email", example: "newemail@vibez.com" },
                                password: { type: "string", example: "CurrentPassword123!" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Email update requested. Please verify new email." },
            },
        },
    },

    "/auth/verify-new-email": {
        get: {
            tags: ["Authentication"],
            summary: "Verify pending new email address",
            parameters: [
                { in: "query", name: "token", required: true, schema: { type: "string" } },
                { in: "query", name: "email", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "New email verified successfully" },
            },
        },
    },

    "/auth/resend-email-update": {
        post: {
            tags: ["Authentication"],
            summary: "Resend verification for pending email update",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["password"],
                            properties: {
                                password: { type: "string", example: "CurrentPassword123!" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Email verification resent successfully" },
            },
        },
    },

    "/auth/delete-account": {
        delete: {
            tags: ["Authentication"],
            summary: "Delete authenticated user account",
            description: "Soft deletes the account and logs the user out.",
            security: [{ BearerAuth: [] }],
            responses: {
                200: { description: "Account deleted successfully" },
            },
        },
    },

    "/auth/set-password/{userId}": {
        post: {
            tags: ["Authentication"],
            summary: "Directly set user password (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
                { in: "path", name: "userId", required: true, schema: { type: "string" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["password"],
                            properties: {
                                password: { type: "string", example: "AdminSetPassword123!" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Password set successfully" },
            },
        },
    },
};

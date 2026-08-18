# VIBEZ Backend API

Vibez Backend is a robust, modular, and high-performance backend application built with **Node.js**, **Express**, and **TypeScript**. It serves as the core API service for the VIBEZ application, supporting role-based access control, restaurant management, table reservations, promotional deals, multi-gateway payments (Stripe & MyFatoorah), real-time communications via Socket.io, and more.

---

## 🚀 Tech Stack & Core Libraries

- **Runtime & Language**: Node.js, TypeScript (ts-node-dev for development, tsc for compilation)
- **Framework**: Express.js
- **Database**: MongoDB (Object modeling via Mongoose)
- **Authentication**: JSON Web Tokens (JWT), Bcrypt hashing
- **Payments**: Stripe & MyFatoorah
- **File Processing**: Multer (file uploads) & Sharp (image optimization/resizing)
- **Emailing**: Nodemailer (SMTP/Gmail integrations)
- **Validation**: Zod (schema validations)
- **Notifications & Push**: Firebase Cloud Messaging (FCM via firebase-admin)
- **Real-Time & Background**: Socket.io (real-time communication), Node-Cron (scheduled cron tasks), BullMQ & ioredis (background queue processing)

---

## 📁 Project Structure

The codebase is organized following a **Modular Pattern**, where each feature is self-contained with its route, controller, service, model, and interface.

```text
vibez_backend/
├── src/
│   ├── app/
│   │   ├── modules/                  # Modular domain-driven folders
│   │   │   ├── auth/                 # Users & Authentication
│   │   │   ├── commission/           # Referral commission logic
│   │   │   ├── coupon/               # Coupon management
│   │   │   ├── deal/                 # Promotional Deals
│   │   │   ├── faq/                  # Frequently Asked Questions
│   │   │   ├── favorite/             # User Favorites
│   │   │   ├── notification/         # FCM Push Notifications
│   │   │   ├── promocodes/           # Coupon & Promo Codes
│   │   │   ├── public/               # Public assets / endpoints
│   │   │   ├── reservation/          # Restaurant table bookings
│   │   │   ├── restaurant/           # Restaurant profiles & menus
│   │   │   ├── review/               # Customer feedback & ratings
│   │   │   ├── saved-deal/           # Saved/Bookmarked deals
│   │   │   ├── settings/             # System settings & configuration
│   │   │   ├── shorts/               # Short video reels/clips
│   │   │   ├── stripe/               # Stripe integration & webhooks
│   │   │   ├── subscription/         # Platform subscription tiers
│   │   │   ├── user/                 # Admin User Management
│   │   │   ├── usersubscription/     # Subscribed user plans
│   │   │   └── withdraw/             # Commission payouts
│   │   └── routes/                   # API Route Registry
│   ├── errors/                       # Global error handling utilities
│   ├── utils/                        # Helper functions (catchAsync, sendResponse, etc.)
│   ├── app.ts                        # Express App definition & middlewares
│   └── server.ts                     # Database connection & Server listener
├── public/                           # Static assets
├── uploads/                          # User-uploaded files
├── .env.example                      # Template for environment variables
├── package.json                      # Project dependencies & scripts
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **MongoDB** (local instance or MongoDB Atlas cluster URI)
- **Redis** (optional, required if running background workers/BullMQ)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd vibez_backend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

---

## ⚙️ Environment Variables

Update the following keys in your `.env` file:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Running Environment | `development` / `production` |
| `PORT` | Listening Port | `5000` |
| `MONGODB_URL` | MongoDB Connection URI | `mongodb+srv://...` |
| `BCRYPT_SALT_ROUNDS` | Cost factor for password hashing | `12` |
| `CLIENT_URL` | Frontend client application URL | `http://localhost:3000` |
| `JWT_ACCESS_SECRET` | Secret key for signing Access Tokens | `your_access_secret` |
| `JWT_ACCESS_EXPIRE` | Expiry duration for Access Tokens | `30d` |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens | `your_refresh_secret` |
| `JWT_REFRESH_EXPIRE` | Expiry duration for Refresh Tokens | `365d` |
| `JWT_PASSWORD_RESET_SECRET`| Secret key for resetting passwords | `your_reset_secret` |
| `SMTP_HOST` | Email SMTP Server Host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP Server Port | `587` |
| `SMTP_USER` | Sender email address | `example@gmail.com` |
| `SMTP_PASS` | App password for Gmail/SMTP | `your_email_app_password` |
| `INITIAL_ADMIN_NAME` | Initial Admin Name | `Appon Islam` |
| `INITIAL_ADMIN_EMAIL` | Initial Admin Email | `admin@vibez.com` |
| `INITIAL_ADMIN_PASSWORD` | Initial Admin Password | `123456` |
| `INITIAL_ADMIN_PHONE` | Initial Admin Phone Number | `+8801722779803` |
| `MYFATOORAH_API_KEY` | MyFatoorah Payment Gateway Token | `myfatoorah_token` |

---

## 🏃 Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs the server in development mode with auto-reload (using `ts-node-dev`) |
| `npm run build` | Compiles the TypeScript code to standard JavaScript in the `dist/` directory |
| `npm run start` | Runs the compiled JavaScript server in production mode |
| `npm run lint` | Lints the codebase using ESLint rules |
| `npm run lint:fix` | Automatically resolves autofixable linting issues |
| `npm run worker:dev` | Runs the background worker queue in development mode |
| `npm run worker` | Runs the compiled worker script in production mode |

---

## 🛰️ API Routes Reference

All API routes are prefixed with `/api/v1`.

### 🔑 Authentication (`/api/v1/auth`)
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate user & get tokens
- `POST /auth/refresh-token` - Retrieve a new access token using refresh token
- `POST /auth/change-password` - Update account password (authenticated)
- `POST /auth/forgot-password` - Request a password reset OTP
- `POST /auth/verify-otp` - Verify the password reset OTP
- `POST /auth/reset-password` - Reset password with verified token

### 🍕 Restaurants (`/api/v1/restaurants`)
- `GET /restaurants` - Retrieve approved restaurant list (supports search, geolocation, filters)
- `GET /restaurants/admin/all` - Retrieve all restaurants (Admin only, includes unapproved ones)
- `POST /restaurants` - Create restaurant profile (Admin/Owner; auto-approves if allowed by settings)
- `GET /restaurants/:id` - Fetch details of a specific restaurant
- `PATCH /restaurants/:id` - Update restaurant info
- `DELETE /restaurants/:id` - Soft-delete restaurant (Admin/Owner)
- `PATCH /restaurants/:id/approve` - Approve a restaurant profile (Admin only)
- `PATCH /restaurants/:id/revoke-approval` - Revoke restaurant approval (Admin only)

### 👥 User & Staff Administration (`/api/v1/users`)
- `GET /users` - Paginated user listing with support for search and filtering by role/influencer/active status (Admin only)
- `GET /users/stats` - Fetch platform usage statistics: total, regular, influencer, and premium users (Admin only)
- `GET /users/:id/activity` - Detailed chronological view of referrals, subscriptions, commissions, and withdrawals (Admin only)
- `PATCH /users/:id/edit` - Modify user's influencer status and customized commission terms (Admin only)
- `PATCH /users/:id/toggle-status` - Toggle a user's active/banned status (Admin only)
- `POST /users/staff` - Create a new staff account (Manager/Cashier/Waiter) with optional profile image upload (Owner/Admin)
- `GET /users/staff` - Paginated listing of all staff members registered under the owner's restaurant (Owner/Admin)
- `PATCH /users/staff/:staffId/toggle-login` - Enable or disable login permission for a specific staff member (Owner/Admin)
- `PATCH /users/staff/toggle-all-login` - Enable or disable login permission for all staff members of the restaurant simultaneously (Owner/Admin)

### 🏷️ Deals & Promotions (`/api/v1/deals`)
- `GET /deals` - Retrieve all active deals (pass `?restaurantId=ID` to filter by restaurant)
- `GET /deals/:dealId` - Get individual deal information
- `POST /deals` - Create a new deal (Admin/Owner)
- `PATCH /deals/:dealId` - Update deal details
- `PATCH /deals/:dealId/toggle-status` - Toggle active/inactive status (Admin)
- `DELETE /deals/:dealId` - Remove deal

### 📅 Reservations (`/api/v1/reservations`)
- `POST /reservations` - Book a table
- `GET /reservations` - Get booking list (filters apply based on roles)
- `PATCH /reservations/:id/status` - Update reservation status (Pending/Confirmed/Cancelled)

### 💳 Subscriptions & Payments (`/api/v1/subscriptions`)
- `GET /subscriptions` - Get active subscription tiers
- `POST /subscriptions/checkout` - Create payment gateway session
- `POST /subscription/webhook` - Stripe payment webhooks receiver (handles updates)

### 🎥 Shorts (`/api/v1/shorts`)
- `GET /shorts` - Retrieve video feeds
- `POST /shorts` - Upload a new short video clip

---

## 🗄️ Database Schema & Data Models

The database is built on **MongoDB** using **Mongoose** object modeling. Below is the detailed schema layout for every collection:

---

### 1. 👤 `users` Collection (`UserModel`)
**Collection Name**: `users`  
**Description**: Stores system users, restaurant owners, staff accounts, and admin profiles.

| Field | Type | Required / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Primary Key |
| `name` | `String` | Required, Trimmed | Full name of the user |
| `email` | `String` | Required, Unique, Lowercase | User email address |
| `password` | `String` | Required | Encrypted password hash (Bcrypt) |
| `role` | `String` | Enum (`ADMIN`, `RESTAURANT_OWNER`, `USER`, `STAFF`) | Account authorization role (Default: `USER`) |
| `staffRole` | `String` | Enum (`MANAGER`, `CASHIER`, `WAITER`) | Role scope if `role` == `STAFF` |
| `restaurantId` | `ObjectId` | Ref: `Restaurant` | Associated restaurant ID for staff/owners |
| `enableStaffLogin` | `Boolean` | Default: `true` | Access permission toggle for staff account |
| `phone` | `String` | Optional | Contact phone number |
| `profileImage` | `String` | Optional | Profile image file path / URL |
| `location` | `Object` | `{ lat: Number, lng: Number }` | Coordinates of user |
| `address` | `Object` | `{ street, city, state, zipCode, country }` | User physical address details |
| `aboutme` | `String` | Optional | User bio |
| `isActive` | `Boolean` | Default: `true` | Account active state |
| `isEmailVerified` | `Boolean` | Default: `false` | Email verification flag |
| `isDeleted` | `Boolean` | Default: `false` | Soft deletion status |
| `isInfluencer` | `Boolean` | Default: `false` | Influencer account status |
| `isNewUser` | `Boolean` | Default: `true` | New user flag |
| `lastLogin` | `Date` | Optional | Timestamp of last user login |
| `balance` | `Number` | Default: `0`, Min: `0` | Referral commission balance (USD) |
| `commissionPercentage` | `Number` | Default: `0` | Customized influencer commission rate (%) |
| `maxPayout` | `Number` | Default: `0` | Max commission cap limit |
| `commissionDuration` | `Number` | Default: `0` | Commission validity period in days |
| `favoriteCuisines` | `[String]` | Default: `[]` | User preferences for cuisine filtering |
| `dietaryPreferences` | `[String]` | Default: `[]` | Preferred dietary flags |
| `referralCode` | `String` | Unique, Sparse | Auto-generated referral code for invite links |
| `referredBy` | `ObjectId` | Ref: `User` | User ID of the referrer |
| `stripeConnectedAccountId`| `String` | Optional | Stripe Connect Account ID for payouts |
| `fcmTokens` | `[String]` | Default: `[]` | Firebase Push Notification Device Tokens |
| `createdAt` | `Date` | Auto | Account creation timestamp |
| `updatedAt` | `Date` | Auto | Account update timestamp |

---

### 2. 🏪 `restaurants` Collection (`RestaurantModel`)
**Collection Name**: `restaurants`  
**Description**: Stores restaurant profile, address, operating hours, and approval status.

| Field | Type | Required / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Primary Key |
| `restaurantName` | `String` | Required, Trimmed | Official name of the restaurant |
| `restaurantDescription` | `String` | Required, Trimmed | Restaurant details & description |
| `restaurantType` | `String` | Enum (`RestaurantType`) | Type of food establishment |
| `cuisineType` | `[String]` | Enum (`CuisineType`), Required | List of served cuisines |
| `foodType` | `[String]` | Enum (`FoodType`), Default: `[]` | Specific food category tags |
| `restaurantOwner` | `ObjectId` | Ref: `User`, Required | Owner user account ID |
| `restaurantWebsite` | `String` | Optional, Trimmed | Official website URL |
| `restaurantAddress.street` | `String` | Required | Street name / house number |
| `restaurantAddress.city` | `String` | Required | City |
| `restaurantAddress.state` | `String` | Required | State / Province |
| `restaurantAddress.zipCode` | `String` | Required | Postal / Zip code |
| `restaurantAddress.country` | `String` | Required | Country |
| `restaurantAddress.location` | `Object` | `GeoJSON Point { type: "Point", coordinates: [lng, lat] }` | GeoJSON location for 2dsphere spatial queries |
| `restaurantOpenHours` | `[Array]` | Required | Daily open/close time slots (`day`, `isOpen`, `slots`) |
| `restaurantImage` | `String` | Optional | Primary cover image URL |
| `restaurantImages` | `[String]` | Default: `[]` | Additional gallery photos |
| `approved` | `Boolean` | Default: `false` | Approval status by Admin |
| `approvedBy` | `ObjectId` | Ref: `User` | Admin ID who approved profile |
| `approvedAt` | `Date` | Optional | Timestamp of approval |
| `createdAt` | `Date` | Auto | Record creation timestamp |
| `updatedAt` | `Date` | Auto | Record update timestamp |

---

### 3. 🏷️ `deals` Collection (`DealModel`)
**Collection Name**: `deals`  
**Description**: Promotional deals & coupons generated by restaurants or platform admin.

| Field | Type | Required / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Primary Key |
| `title` | `String` | Required | Title of the promotional deal |
| `description` | `String` | Required | Detailed description of offer |
| `restaurantId` | `ObjectId` | Ref: `Restaurant`, Required | Associated restaurant ID |
| `code` | `String` | Required, Unique, Uppercase | Coupon discount code |
| `discountPercentage` | `Number` | Min: `0`, Max: `100` | Percentage discount |
| `originalPrice` | `Number` | Optional | Original item price before deal |
| `discountedPrice` | `Number` | Optional | Discounted final price |
| `validFrom` | `Date` | Required | Deal activation start timestamp |
| `validUntil` | `Date` | Required | Deal expiration timestamp |
| `bannerImage` | `String` | Optional | Promotional image |
| `termsAndConditions` | `String` | Optional | Deal conditions |
| `isActive` | `Boolean` | Default: `true` | Deal active state |
| `isDeleted` | `Boolean` | Default: `false` | Soft deletion status |
| `usageLimit` | `Number` | Default: `0` (Unlimited) | Maximum claim capacity |
| `usedCount` | `Number` | Default: `0` | Number of times claimed |

---

### 4. 📅 `reservations` Collection (`ReservationModel`)
**Collection Name**: `reservations`  
**Description**: Table booking records for customers at restaurants.

| Field | Type | Required / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Primary Key |
| `userId` | `ObjectId` | Ref: `User`, Required | Customer user ID |
| `restaurantId` | `ObjectId` | Ref: `Restaurant`, Required | Target restaurant ID |
| `reservationDate` | `Date` | Required | Date of booking |
| `timeSlot` | `String` | Required | Booked time slot (e.g. `"19:30"`) |
| `partySize` | `Number` | Required, Min: `1` | Number of guests |
| `guestName` | `String` | Required | Booking contact person name |
| `guestEmail` | `String` | Required | Booking contact email |
| `guestPhone` | `String` | Required | Booking contact phone number |
| `specialRequest` | `String` | Optional | Customer requests / instructions |
| `status` | `String` | Enum (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`) | Current reservation status |
| `cancellationReason` | `String` | Optional | Reason for cancellation if cancelled |

---

### 5. 💳 Subscriptions (`SubscriptionPlanModel` & `UserSubscriptionModel`)
**Collection Names**: `subscriptions`, `usersubscriptions`

#### 🔹 `subscriptions` Schema (`SubscriptionPlan`)
- `name` (`String`, Required, Unique): Name of plan (e.g. `"Gold VIP"`)
- `price` (`Number`, Required): Subscription cost
- `interval` (`String`, Enum: `monthly`, `yearly`): Billing cycle
- `features` (`[String]`): List of included benefits
- `stripePriceId` (`String`, Unique): Stripe API Price Object ID
- `stripeProductId` (`String`, Unique): Stripe API Product ID
- `isActive` (`Boolean`, Default: `true`): Availability status

#### 🔹 `usersubscriptions` Schema (`UserSubscription`)
- `userId` (`ObjectId -> User`): Subscribed customer ID
- `subscriptionPlanId` (`ObjectId -> SubscriptionPlan`): Active plan tier ID
- `status` (`String`, Enum: `active`, `cancelled`, `expired`)
- `startDate` (`Date`): Subscription activation date
- `endDate` (`Date`): Subscription renewal / expiry date
- `stripeSubscriptionId` (`String`): Stripe gateway reference
- `commissionUser` (`ObjectId -> User`): Influencer ID who earned referral commission from this signup

---

### 6. 💰 Commissions & Payouts (`CommissionModel` & `WithdrawModel`)
**Collection Names**: `commissions`, `withdraws`

#### 🔹 `commissions` Schema (`Commission`)
- `influencerId` (`ObjectId -> User`): Referrer receiving commission
- `referredUserId` (`ObjectId -> User`): User who subscribed via referral code
- `subscriptionId` (`ObjectId -> UserSubscription`): Associated subscription transaction
- `amount` (`Number`): Calculated commission reward in USD
- `status` (`String`, Enum: `PENDING`, `APPROVED`, `PAID`)

#### 🔹 `withdraws` Schema (`Withdraw`)
- `userId` (`ObjectId -> User`): Influencer / user requesting payout
- `amount` (`Number`, Required): Requested withdrawal amount
- `status` (`String`, Enum: `PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED`)
- `stripeTransferId` (`String`, Unique, Sparse): Stripe Payout Transfer ID
- `payoutDetails` (`Mixed`): Custom payment destination metadata

---

### 7. 🎥 `shorts`, ⭐ `reviews`, ❤️ `favorites`, 🔖 `saveddeals`

- **`shorts`**: `restaurantId` (`ObjectId -> Restaurant`), `videoUrl` (`String`), `title` (`String`), `description` (`String`), `views` (`Number`), `likes` (`Number`), `isActive` (`Boolean`).
- **`reviews`**: `restaurantId` (`ObjectId -> Restaurant`), `userId` (`ObjectId -> User`), `rating` (`Number`, 1-5), `comment` (`String`), `isDeleted` (`Boolean`).
- **`favorites`**: `userId` (`ObjectId -> User`), `restaurantId` (`ObjectId -> Restaurant`). Unique index on `[userId, restaurantId]`.
- **`saveddeals`**: `userId` (`ObjectId -> User`), `dealId` (`ObjectId -> Deal`). Unique index on `[userId, dealId]`.

---

## 🛡️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.




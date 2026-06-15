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
- **Real-Time & Background**: Socket.io (real-time communication), BullMQ & ioredis (background queue processing)

---

## 📁 Project Structure

The codebase is organized following a **Modular Pattern**, where each feature is self-contained with its route, controller, service, model, and interface.

```text
vibez_backend/
├── src/
│   ├── app/
│   │   ├── modules/                  # Modular domain-driven folders
│   │   │   ├── auth/                 # Users & Authentication
│   │   │   ├── deal/                 # Promotional Deals
│   │   │   ├── faq/                  # Frequently Asked Questions
│   │   │   ├── favorite/             # User Favorites
│   │   │   ├── promocodes/           # Coupon & Promo Codes
│   │   │   ├── public/               # Public assets / endpoints
│   │   │   ├── reservation/          # Restaurant table bookings
│   │   │   ├── restaurant/           # Restaurant profiles & menus
│   │   │   ├── review/               # Customer feedback & ratings
│   │   │   ├── saved-deal/           # Saved/Bookmarked deals
│   │   │   ├── shorts/               # Short video reels/clips
│   │   │   ├── stripe/               # Stripe integration & webhooks
│   │   │   ├── subscription/         # Platform subscription tiers
│   │   │   └── usersubscription/     # Subscribed user plans
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
| `SUPERADMINEMAIL` | Default Super Admin email address | `admin@vibez.com` |
| `SUPERADMINPASSWORD` | Default Super Admin password | `super_admin_pass` |
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
- `GET /restaurants` - Retrieve restaurant list (supports search, geolocation, filter)
- `POST /restaurants` - Create restaurant profile (Admin/Owner)
- `GET /restaurants/:id` - Fetch details of a specific restaurant
- `PATCH /restaurants/:id` - Update restaurant info
- `DELETE /restaurants/:id` - Soft-delete restaurant (Admin)

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

## 🛡️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


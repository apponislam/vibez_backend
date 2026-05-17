# lolfortnite650 Backend

This is the backend for the lolfortnite650 project, built with Node.js, Express, and MongoDB.

## Features
- User Authentication (Registration, Login, OTP Verification, Password Reset)
- Class Management (Creation, Update, Review, Status Management)
- Zoom Integration (Meeting Creation, Recording Management)
- Payment Integration (MyFatoorah)
- Google Drive Integration (Automatic Recording Upload)
- Real-time Messaging
- Tutor Availability & Slot Management

## Prerequisites
- Node.js (v16 or later)
- MongoDB
- Postman (for API testing)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd lolfortnite650_Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   NODE_ENV=development
   PORT=5010
   MONGODB_URL=your_mongodb_url
   BASE_API=http://localhost:5010/api/v1
   JWT_ACCESS_SECRET=your_access_secret
   JWT_ACCESS_EXPIRE=30d
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_REFRESH_EXPIRE=365d
   # Add other required variables from .env.example
   ```

4. **Run the application:**
   - Development mode: `npm run dev`
   - Production mode: `npm run build && npm start`

## API Documentation

### Postman Collection
A comprehensive Postman collection is available in the `postman_collection.json` file. Import it into Postman to test all endpoints.

### Main Modules
- **Auth**: `/api/v1/auth`
- **Classes**: `/api/v1/classes`
- **Zoom**: `/api/v1/zoom`
- **Messages**: `/api/v1/messages`
- **Payments**: `/api/v1/class-payments`
- **Dashboard**: `/api/v1/dashboard`

## Project Structure
- `src/app/modules`: Contains all feature modules (controllers, services, routes, models).
- `src/app/middlewares`: Custom Express middlewares.
- `src/app/routes`: Main route entry point.
- `src/errors`: Error handling logic.
- `src/socket`: Socket.io configuration for real-time features.

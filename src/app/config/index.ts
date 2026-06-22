import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    ip: process.env.IP,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodb_url: process.env.MONGODB_URL,

    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_access_expire: process.env.JWT_ACCESS_EXPIRE,

    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_refresh_expire: process.env.JWT_REFRESH_EXPIRE,

    jwt_password_reset_secret: process.env.JWT_PASSWORD_RESET_SECRET,
    client_url: process.env.CLIENT_URL,

    mail: {
        smtp_host: process.env.SMTP_HOST,
        smtp_port: process.env.SMTP_PORT,
        smtp_secure: process.env.SMTP_SECURE,
        smtp_user: process.env.SMTP_USER,
        smtp_pass: process.env.SMTP_PASS,
    },

    stripe: {
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        secret_key: process.env.STRIPE_SECRET_KEY,
        webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },

    superAdminPassword: process.env.SUPERADMINPASSWORD,
    superAdminEmail: process.env.SUPERADMINEMAIL,
    maps_api_key: process.env.MAPS_API_KEY,
};

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
    zoom: {
        account_id: process.env.ZOOM_ACCOUNT_ID,
        client_id: process.env.ZOOM_CLIENT_ID,
        client_secret: process.env.ZOOM_CLIENT_SECRET,
        webhook_secret: process.env.ZOOM_WEBHOOK_SECRET_TOKEN,
    },

    drive: {
        folder_id: process.env.DRIVE_FOLDER_ID,
        credentials_path: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.cwd(), "google-credentials.json"),
    },

    myfatoorah: {
        api_key: process.env.MYFATOORAH_API_KEY,
        base_url: process.env.MYFATOORAH_BASE_URL,
        webhook_secret: process.env.MYFATOORAH_WEBHOOK_SECRET,
    },

    superAdminPassword: process.env.SUPERADMINPASSWORD,
    superAdminEmail: process.env.SUPERADMINEMAIL,
};

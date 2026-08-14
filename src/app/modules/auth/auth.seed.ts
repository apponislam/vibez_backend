import bcrypt from "bcrypt";
import { UserModel } from "./auth.model";
import config from "../../config";

export const seedAdmin = async () => {
    try {
        const adminExists = await UserModel.findOne({
            role: "ADMIN",
        });

        if (!adminExists) {
            console.log("📝 No admin found, creating one...");

            if (!config.initialAdmin.name) {
                console.log("⚠️ INITIAL_ADMIN_NAME is missing in environment variables. Skipping admin creation.");
                return;
            }
            if (!config.initialAdmin.email) {
                console.log("⚠️ INITIAL_ADMIN_EMAIL is missing in environment variables. Skipping admin creation.");
                return;
            }
            if (!config.initialAdmin.password) {
                console.log("⚠️ INITIAL_ADMIN_PASSWORD is missing in environment variables. Skipping admin creation.");
                return;
            }
            if (!config.initialAdmin.phone) {
                console.log("⚠️ INITIAL_ADMIN_PHONE is missing in environment variables. Skipping admin creation.");
                return;
            }

            const hashedPassword = await bcrypt.hash(config.initialAdmin.password as string, Number(config.bcrypt_salt_rounds));

            const admin = {
                name: config.initialAdmin.name,
                email: config.initialAdmin.email,
                password: hashedPassword,
                role: "ADMIN",
                phone: config.initialAdmin.phone,
                isActive: true,
                isEmailVerified: true,
            };

            await UserModel.create(admin as any);

            console.log("✅ Admin created:", config.initialAdmin.email);
        } else {
            console.log("✅ Admin already exists, skipping creation");
        }
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
    }
};

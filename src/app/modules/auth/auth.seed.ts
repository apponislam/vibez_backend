import bcrypt from "bcrypt";
import { UserModel } from "./auth.model";
import config from "../../config";

export const seedSuperAdmin = async () => {
    try {
        const adminExists = await UserModel.findOne({
            role: "SUPER_ADMIN",
        });

        if (!adminExists) {
            console.log("📝 No super admin found, creating one...");

            const hashedPassword = await bcrypt.hash(config.superAdminPassword as string, Number(config.bcrypt_salt_rounds));

            const superAdmin = {
                name: "Super Admin",
                email: config.superAdminEmail,
                password: hashedPassword,
                role: "SUPER_ADMIN",
                phone: "0000000000",
                isActive: true,
                isEmailVerified: true,
            };

            await UserModel.create(superAdmin);

            console.log("✅ Super admin created:", config.superAdminEmail);
        } else {
            console.log("✅ Super admin already exists, skipping creation");
        }
    } catch (error) {
        console.error("❌ Error seeding super admin:", error);
    }
};

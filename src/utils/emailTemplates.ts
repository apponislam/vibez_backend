import { sendMail } from "./nodemailer";

export const sendVerificationEmail = (email: string, name: string, otp: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; text-align: left;">
                <!-- Header Gradient -->
                <div style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">VIBEZ</h1>
                </div>
                <!-- Body Content -->
                <div style="padding: 40px 30px; color: #1f2937;">
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Hello ${name},</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                        Thank you for registering with <strong>VIBEZ</strong>. To complete your sign-up and verify your email address, please use the verification code below:
                    </p>
                    <!-- OTP Display -->
                    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #cf0738; display: block; font-family: monospace; margin-left: 8px;">${otp}</span>
                        <span style="font-size: 12px; color: #6b7280; display: block; margin-top: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Verification Code</span>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
                        This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email or contact support.
                    </p>
                </div>
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0 0 8px 0;">Please do not reply directly to this email.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} VIBEZ. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
    sendMail(email, "Verify Your Email", html);
};

export const sendOtpEmail = (email: string, otp: string, name?: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; text-align: left;">
                <!-- Header Gradient -->
                <div style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">VIBEZ</h1>
                </div>
                <!-- Body Content -->
                <div style="padding: 40px 30px; color: #1f2937;">
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">${name ? `Hello ${name},` : "Hello,"}</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                        You requested a verification code. Please use the following One-Time Password (OTP) to proceed:
                    </p>
                    <!-- OTP Display -->
                    <div style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #cf0738; display: block; font-family: monospace; margin-left: 8px;">${otp}</span>
                        <span style="font-size: 12px; color: #6b7280; display: block; margin-top: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">OTP Security Code</span>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
                        This code is valid for <strong>10 minutes</strong>. For security, never share this code with anyone.
                    </p>
                </div>
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0 0 8px 0;">Please do not reply directly to this email.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} VIBEZ. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
    sendMail(email, "Your OTP Code", html);
};

export const sendWelcomeEmail = (email: string, name: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; text-align: left;">
                <!-- Header Gradient -->
                <div style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">VIBEZ</h1>
                </div>
                <!-- Body Content -->
                <div style="padding: 40px 30px; color: #1f2937;">
                    <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px; text-align: center;">Welcome ${name}! 🎉</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; text-align: center;">
                        We are thrilled to welcome you to our platform.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                        VIBEZ is designed to help you manage operations seamlessly and elevate your dining or business experience. Take a moment to set up your profile and explore your dashboard.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: bold; box-shadow: 0 4px 12px rgba(207, 7, 56, 0.35);">Get Started</a>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0; text-align: center;">
                        If you have any questions, our support team is available 24/7.
                    </p>
                </div>
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0 0 8px 0;">Please do not reply directly to this email.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} VIBEZ. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
    sendMail(email, "Welcome to Our Platform", html);
};

export const sendEmailUpdateVerification = (email: string, name: string, verificationUrl: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; text-align: left;">
                <!-- Header Gradient -->
                <div style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">VIBEZ</h1>
                </div>
                <!-- Body Content -->
                <div style="padding: 40px 30px; color: #1f2937;">
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Hello ${name},</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                        We received a request to update the email address linked to your VIBEZ account. Please verify your new email address by clicking the button below:
                    </p>
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${verificationUrl}" style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: bold; box-shadow: 0 4px 12px rgba(207, 7, 56, 0.35);">Verify New Email</a>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
                        This link expires in <strong>24 hours</strong>. If you did not request this update, your current email address remains safe and active. No action is required.
                    </p>
                </div>
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0 0 8px 0;">Please do not reply directly to this email.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} VIBEZ. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
    sendMail(email, "Verify Your New Email", html);
};

export const sendStaffWelcomeEmail = (email: string, name: string, passwordPlain: string, restaurantName: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; text-align: left;">
                <!-- Header Gradient -->
                <div style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">VIBEZ</h1>
                </div>
                <!-- Body Content -->
                <div style="padding: 40px 30px; color: #1f2937;">
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Welcome ${name}!</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                        You have been registered as a staff member for <strong>${restaurantName}</strong>.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 16px;">
                        Here are your account credentials to log in:
                    </p>
                    <div style="background-color: #f9fafb; border-left: 4px solid #cf0738; padding: 20px; margin: 24px 0; border-radius: 0 12px 12px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 15px; color: #374151;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 0; font-size: 15px; color: #374151;"><strong>Password:</strong> ${passwordPlain}</p>
                    </div>
                </div>
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0 0 8px 0;">Please do not reply directly to this email.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} VIBEZ. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
    sendMail(email, `Welcome to ${restaurantName} - Staff Account Details`, html);
};

export const sendStaffPasswordResetEmail = (email: string, name: string, passwordPlain: string, restaurantName: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; text-align: left;">
                <!-- Header Gradient -->
                <div style="background: linear-gradient(135deg, #cf0738 0%, #ff4d6d 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">VIBEZ</h1>
                </div>
                <!-- Body Content -->
                <div style="padding: 40px 30px; color: #1f2937;">
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Hello ${name},</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                        Your password has been reset by the restaurant owner${restaurantName ? ` of <strong>${restaurantName}</strong>` : ""}.
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 16px;">
                        Here are your new account credentials to log in:
                    </p>
                    <div style="background-color: #f9fafb; border-left: 4px solid #cf0738; padding: 20px; margin: 24px 0; border-radius: 0 12px 12px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 15px; color: #374151;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 0; font-size: 15px; color: #374151;"><strong>Password:</strong> ${passwordPlain}</p>
                    </div>
                </div>
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                    <p style="margin: 0 0 8px 0;">Please do not reply directly to this email.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} VIBEZ. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;
    sendMail(email, `Your Staff Account Password Has Been Reset`, html);
};

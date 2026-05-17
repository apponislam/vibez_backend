import { sendMail } from "./nodemailer";

export const testEmail = async () => {
    try {
        const result = await sendMail("apponislamdev@gmail.com", "Test Email from Your App", "<h1>✅ SMTP Test Successful!</h1><p>This is a test email from your app.</p>", "test@4ppon.com");
        console.log("📨 Test email sent successfully!");
        // console.log("Mail info:", result);
    } catch (err) {
        console.error("❌ Failed to send test email:", err);
    }
};

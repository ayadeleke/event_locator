const sendEmailNotification = require("../services/emailService");
exports.testEmailNotification = async (req, res) => {
    try {
        const testEmail = "adelekeayotunde09@gmail.com";  // Replace with a valid email to test
        const subject = "Test Email from Event Locator";
        const message = "This is a test email sent from the Event Locator application.";

        await sendEmailNotification(testEmail, subject, message);
        res.status(200).json({ message: "Test email sent successfully" });
    } catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({ message: "Error sending test email", error: error.message });
    }
};
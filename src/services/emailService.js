require('dotenv').config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmailNotification(to, subject, message) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

module.exports = sendEmailNotification;

const amqp = require("amqplib");
const sendEmailNotification = require("./emailService");

async function listenForNotifications() {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    const queue = "event_notifications";

    await channel.assertQueue(queue, { durable: true });

    console.log("Waiting for notifications...");
    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            const { userEmail, eventTitle, eventTime } = JSON.parse(msg.content.toString());
            console.log(`Sending email notification to ${userEmail}`);

            const emailSubject = `Upcoming Event: ${eventTitle}`;
            const emailMessage = `Hey! Don't forget about "${eventTitle}" happening at ${eventTime}.`;

            await sendEmailNotification(userEmail, emailSubject, emailMessage);
            channel.ack(msg);
        }
    });
}

listenForNotifications();

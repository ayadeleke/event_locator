const amqp = require("amqplib");

async function sendNotification(userId, message, delay = 0) {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    const queue = "event_notifications";

    await channel.assertQueue(queue, { durable: true });

    if (delay > 0) {
        await channel.assertExchange("delayed-exchange", "direct", { durable: true });
        await channel.assertQueue(queue, { durable: true, arguments: { "x-dead-letter-exchange": "delayed-exchange", "x-message-ttl": delay } });
        await channel.bindQueue(queue, "delayed-exchange", "");

        channel.sendToQueue(queue, Buffer.from(JSON.stringify({ userId, message })));
    } else {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify({ userId, message })), { persistent: true });
    }

    console.log(`Notification queued: ${message}`);
    setTimeout(() => connection.close(), 500);
}

module.exports = sendNotification;

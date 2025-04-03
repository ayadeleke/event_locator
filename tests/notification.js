const amqp = require('amqplib');

async function sendNotification() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'notifications';

    await channel.assertQueue(queue, { durable: false });

    const message = "Upcoming Event: Tech Conference on April 15!";
    channel.sendToQueue(queue, Buffer.from(message));

    console.log("Notification sent:", message);
}

sendNotification();

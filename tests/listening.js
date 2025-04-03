const amqp = require('amqplib');

async function receiveNotification() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'notifications';

    await channel.assertQueue(queue, { durable: false });

    console.log("Waiting for messages...");
    channel.consume(queue, (msg) => {
        console.log("Received:", msg.content.toString());
    }, { noAck: true });
}

receiveNotification();

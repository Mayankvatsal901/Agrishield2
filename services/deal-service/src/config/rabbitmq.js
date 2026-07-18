// ============================================================
// RABBITMQ CONNECTION
// ------------------------------------------------------------
// Creates and maintains a RabbitMQ connection.
//
// This file is used by:
// 1. Publisher (publish events)
// 2. Subscriber (future use)
//
// Other files should call getChannel() instead of
// creating new RabbitMQ connections.
// ============================================================

import amqp from "amqplib";

let connection;
let channel;

// ============================================================
// CONNECT TO RABBITMQ
// ============================================================

export const connectRabbitMQ = async () => {
    try {

        connection = await amqp.connect(
            process.env.RABBITMQ_URL
        );

        channel = await connection.createChannel();
        await channel.assertExchange(
            "agrishield.events",
            "topic",
            {
                durable: true,
            }
        );
        console.log(
            "✅ Deal Service connected to RabbitMQ"
        );

    } catch (error) {

        console.error(
            "❌ RabbitMQ Connection Error:",
            error.message
        );

        throw error;
    }
};

// ============================================================
// GET CHANNEL
// ------------------------------------------------------------
// Used everywhere else in the service.
// ============================================================

export const getChannel = () => {

    if (!channel) {

        throw new Error(
            "RabbitMQ channel not initialized."
        );

    }

    return channel;
};
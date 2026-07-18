// ============================================================
// RABBITMQ CONNECTION
// ------------------------------------------------------------
// Creates and maintains the RabbitMQ connection for
// Contract Service.
//
// This connection will be used to:
// 1. Listen for accepted deal events from Deal Service.
// 2. Later publish contract-created events.
// ============================================================

import amqp from "amqplib";

let connection;
let channel;

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

        console.log("✅ Contract Service connected to RabbitMQ");

        return channel;

    } catch (error) {

        console.error(
            "❌ RabbitMQ Connection Error:",
            error.message
        );

        throw error;
    }
};


// ============================================================
// GET RABBITMQ CHANNEL
// ------------------------------------------------------------
// Allows other files such as subscriber.js and publisher.js
// to use the existing RabbitMQ channel.
// ============================================================

export const getChannel = () => {

    if (!channel) {
        throw new Error(
            "RabbitMQ channel is not initialized."
        );
    }

    return channel;
};
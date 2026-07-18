// ============================================================
// RABBITMQ CONFIGURATION
// ============================================================

import amqp from "amqplib";

let connection = null;
let channel = null;

// ============================================================
// Connect To RabbitMQ
// ============================================================

export const connectRabbitMQ = async () => {

    try {

        connection = await amqp.connect(
            process.env.RABBITMQ_URL
        );

        channel = await connection.createChannel();

        console.log("✅ Notification Service connected to RabbitMQ");

    } catch (error) {

        console.error("❌ RabbitMQ Connection Failed");
        console.error(error);

        process.exit(1);

    }

};

// ============================================================
// Get RabbitMQ Channel
// ============================================================

export const getChannel = () => {

    if (!channel) {

        throw new Error(
            "RabbitMQ Channel Not Initialized"
        );

    }

    return channel;

};
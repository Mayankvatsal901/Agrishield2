// ============================================================
// SERVER
// ============================================================

import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

import { connectRabbitMQ } from "./config/rabbitmq.js";

import { startNotificationSubscriber } from "./events/subscriber.js";

// ============================================================
// Start Server
// ============================================================

const PORT = process.env.PORT || 5006;

const startServer = async () => {

    try {

        // ---------------------------------------------
        // RabbitMQ
        // ---------------------------------------------

        await connectRabbitMQ();

        // ---------------------------------------------
        // Subscriber
        // ---------------------------------------------

        await startNotificationSubscriber();

        // ---------------------------------------------
        // Express Server
        // ---------------------------------------------

        app.listen(PORT, () => {

            console.log(`🚀 Notification Service running on port ${PORT}`);

        });

    } catch (error) {

        console.error("❌ Failed to start Notification Service");

        console.error(error);

        process.exit(1);

    }

};

startServer();
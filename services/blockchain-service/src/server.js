// ============================================================
// SERVER
// ============================================================

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

import { connectDB } from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

import { startBlockchainSubscriber } from "./events/subscriber.js";

const PORT = process.env.PORT || 5007;

const startServer = async () => {

    try {

        // Database
        await connectDB();

        // RabbitMQ
        await connectRabbitMQ();

        // Subscriber
        await startBlockchainSubscriber();

        // Express
        app.listen(PORT, () => {

            console.log(`🚀 Blockchain Service running on port ${PORT}`);

        });

    } catch (error) {

        console.error("❌ Failed To Start Blockchain Service");

        console.error(error);

    }

};

startServer();
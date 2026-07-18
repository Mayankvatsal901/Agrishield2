// ============================================================
// CONTRACT SERVICE SERVER
// ------------------------------------------------------------
// Starts the Contract Service.
//
// Startup order:
// 1. Connect MongoDB
// 2. Connect RabbitMQ
// 3. Start Deal Accepted subscriber
// 4. Start HTTP server
// ============================================================

import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

import connectDB from "./config/database.js";
const { startPdfWorker }=await import ("./workers/pdf.worker.js");

 const {
    connectRabbitMQ,
} =await import  ("./config/rabbitmq.js");

const {
    subscribeToDealAccepted,
}=await import("./events/subscriber.js");


const PORT = process.env.PORT || 5005;


const startServer = async () => {

    try {

        // Connect Contract Service database
        await connectDB();


        // Connect Contract Service to RabbitMQ
        await connectRabbitMQ();


        // Start listening for accepted deal events
        await subscribeToDealAccepted();
        await startPdfWorker();


        app.listen(PORT, () => {

            console.log(
                `🚀 Contract Service running on port ${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "❌ Contract Service startup failed:",
            error.message
        );

        process.exit(1);
    }

};


startServer();
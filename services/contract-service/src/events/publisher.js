// ============================================================
// CONTRACT EVENT PUBLISHER
// ============================================================

import { getChannel } from "../config/rabbitmq.js";

// ============================================================
// Queue Names
// ============================================================

const PDF_QUEUE = "contract.generate";

// ============================================================
// Exchange Name
// ============================================================

const EXCHANGE_NAME = "agrishield.events";

// ============================================================
// Publish PDF Generation Job
// Queue : contract.generate
// ============================================================

export const publishPdfGeneration = async (data) => {

    const channel = getChannel();

    await channel.assertQueue(PDF_QUEUE, {
        durable: true,
    });

    channel.sendToQueue(

        PDF_QUEUE,

        Buffer.from(JSON.stringify(data)),

        {
            persistent: true,
        }

    );

    console.log("\n====================================");
    console.log("📄 PDF Generation Job Published");
    console.log("Queue : contract.generate");
    console.log("====================================\n");

};

// ============================================================
// Publish Contract Generated Event
// Exchange : agrishield.events
// Routing Key : contract.generated
// ============================================================

export const publishContractGenerated = async (data) => {

    const channel = getChannel();

    await channel.assertExchange(

        EXCHANGE_NAME,

        "topic",

        {
            durable: true,
        }

    );

    channel.publish(

        EXCHANGE_NAME,

        "contract.generated",

        Buffer.from(JSON.stringify(data)),

        {
            persistent: true,
        }

    );

    console.log("\n====================================");
    console.log("📢 Contract Generated Event Published");
    console.log("Exchange    : agrishield.events");
    console.log("Routing Key : contract.generated");
    console.log("====================================\n");

};
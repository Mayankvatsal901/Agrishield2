// ============================================================
// BLOCKCHAIN EVENT SUBSCRIBER
// ============================================================

import { getChannel } from "../config/rabbitmq.js";
import { processContractGenerated } from "../services/blockchain.service.js";

const EXCHANGE_NAME = "agrishield.events";
const ROUTING_KEY = "contract.generated";
const QUEUE_NAME = "blockchain.contract.generated";

// ============================================================
// Start Blockchain Subscriber
// ============================================================

export const startBlockchainSubscriber = async () => {

    const channel = getChannel();

    // --------------------------------------------------------
    // Declare Exchange
    // --------------------------------------------------------

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    // --------------------------------------------------------
    // Declare Queue
    // --------------------------------------------------------

    await channel.assertQueue(
        QUEUE_NAME,
        {
            durable: true
        }
    );

    // --------------------------------------------------------
    // Bind Queue To Exchange
    // --------------------------------------------------------

    await channel.bindQueue(
        QUEUE_NAME,
        EXCHANGE_NAME,
        ROUTING_KEY
    );

    console.log("⛓️ Waiting for contract.generated events...");

    // --------------------------------------------------------
    // Consume Messages
    // --------------------------------------------------------

    channel.consume(
        QUEUE_NAME,
        async (message) => {

            if (!message) return;

            try {

                const contractData = JSON.parse(
                    message.content.toString()
                );

                console.log("\n======================================");
                console.log("⛓️ CONTRACT GENERATED EVENT RECEIVED");
                console.log("======================================");
                console.log(contractData);
                console.log("======================================");

                // Process Contract
                await processContractGenerated(contractData);

                console.log("✅ Contract Processed Successfully");

                channel.ack(message);

            } catch (error) {

                console.error("❌ Blockchain Processing Failed");
                console.error(error);

                channel.nack(
                    message,
                    false,
                    false
                );

            }

        }
    );

};
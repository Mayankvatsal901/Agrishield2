// ============================================================
// NOTIFICATION EVENT SUBSCRIBER
// ============================================================

import { getChannel } from "../config/rabbitmq.js";

const EXCHANGE_NAME = "agrishield.events";

const QUEUE_NAME = "notification.contract.generated";

const ROUTING_KEY = "contract.generated";

// ============================================================
// Start Notification Subscriber
// ============================================================

export const startNotificationSubscriber = async () => {

    const channel = getChannel();

    // --------------------------------------------------------
    // Create Exchange
    // --------------------------------------------------------

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true,
        }
    );

    // --------------------------------------------------------
    // Create Queue
    // --------------------------------------------------------

    await channel.assertQueue(
        QUEUE_NAME,
        {
            durable: true,
        }
    );

    // --------------------------------------------------------
    // Bind Queue
    // --------------------------------------------------------

    await channel.bindQueue(

        QUEUE_NAME,

        EXCHANGE_NAME,

        ROUTING_KEY

    );

    console.log("🔔 Waiting for contract.generated events...");

    // --------------------------------------------------------
    // Consume Messages
    // --------------------------------------------------------

    channel.consume(

        QUEUE_NAME,

        async (message) => {

            if (!message) return;

            try {

                const event = JSON.parse(
                    message.content.toString()
                );

                console.log("\n======================================");
                console.log("📩 CONTRACT GENERATED EVENT RECEIVED");
                console.log("======================================");

                console.log(event);

                console.log("======================================\n");

                channel.ack(message);

            } catch (error) {

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
// ============================================================
// CONTRACT EVENT SUBSCRIBER
// ------------------------------------------------------------
// Contract Service listens for Deal events.
//
// Flow:
//
// Deal Service
//        │
// publish(deal.accepted)
//        │
// Exchange
//        │
// Queue
//        │
// Contract Service
// ============================================================

import { getChannel } from "../config/rabbitmq.js";
import { createContract } from "../services/contract.service.js";

const EXCHANGE = "agrishield.events";

const QUEUE = "contract.queue";

const ROUTING_KEY = "deal.accepted";

export const subscribeToDealAccepted = async () => {

    const channel = getChannel();

    // Create Queue
    await channel.assertQueue(
        QUEUE,
        {
            durable: true,
        }
    );

    // Connect Queue with Exchange
    await channel.bindQueue(

        QUEUE,

        EXCHANGE,

        ROUTING_KEY

    );

    console.log("👂 Contract Service waiting for deal.accepted events...");

    channel.consume(

        QUEUE,

        async (msg) => {

            if (!msg) return;

            try {

                const event = JSON.parse(
                    msg.content.toString()
                );

                console.log("\n==========================");
                console.log("📩 DEAL ACCEPTED RECEIVED");
                console.log("==========================");

                console.log(event);

                await createContract(event);

                channel.ack(msg);

            } catch (error) {

                console.error(error);

                channel.nack(
                    msg,
                    false,
                    false
                );

            }

        }

    );

};
// ============================================================
// DEAL SERVICE SUBSCRIBER
// ------------------------------------------------------------
// Listens for "contract.generated" from Contract Service and
// moves the deal from CONTRACT_PENDING to CONTRACT_GENERATED,
// so both sides see "Contract ready" on their Deals page.
// ============================================================

import { getChannel } from "../config/rabbitmq.js";
import Deal from "../models/Deal.js";

const EXCHANGE = "agrishield.events";
const QUEUE = "deal.contract-status";
const ROUTING_KEY = "contract.generated";

export const subscribeToContractGenerated = async () => {

    const channel = getChannel();

    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    console.log("👂 Deal Service waiting for contract.generated events...");

    channel.consume(QUEUE, async (msg) => {

        if (!msg) return;

        try {

            const event = JSON.parse(msg.content.toString());

            if (!event.dealId) {
                // An old-style message without a deal id: nothing we can match it to.
                channel.ack(msg);
                return;
            }

            await Deal.findByIdAndUpdate(event.dealId, { status: "CONTRACT_GENERATED" });

            console.log(`📄 Contract ready for deal ${event.dealId}`);

            channel.ack(msg);

        } catch (error) {

            console.error("❌ Couldn't update deal after contract.generated:", error.message);
            channel.nack(msg, false, false);
        }
    });
};
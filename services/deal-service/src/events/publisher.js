// ============================================================
// DEAL EVENT PUBLISHER
// ------------------------------------------------------------
// Responsible for publishing Deal related events.
//
// Example:
// - deal.accepted
// - deal.closed
// ============================================================

import { getChannel } from "../config/rabbitmq.js";

export const publishDealAccepted = async (payload) => {
    const channel = getChannel();

    channel.publish(
        "agrishield.events",
        "deal.accepted",
        Buffer.from(JSON.stringify(payload)),
        {
            persistent: true,
        }
    );

    console.log("📤 Published deal.accepted", payload);
};
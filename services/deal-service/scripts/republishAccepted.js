// ============================================================
// RE-SEND ACCEPTED DEALS
// ------------------------------------------------------------
// Finds every deal that was accepted but still has no contract
// (status CONTRACT_PENDING) and sends "deal.accepted" again, so
// Contract Service can make the contract.
//
// Safe to run more than once: Contract Service never creates a
// second contract for the same deal.
//
// Run from the deal-service folder, with contract-service running:
//
//     node scripts/republishAccepted.js
// ============================================================

import dns from "node:dns";
import "dotenv/config";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { default: Deal } = await import("../src/models/Deal.js");
const { default: Offer } = await import("../src/models/Offer.js");
const { connectRabbitMQ } = await import("../src/config/rabbitmq.js");
const { publishDealAccepted } = await import("../src/events/publisher.js");

await mongoose.connect(process.env.MONGO_URI);
await connectRabbitMQ();

const deals = await Deal.find({ status: "CONTRACT_PENDING", acceptedOfferId: { $ne: null } });

if (!deals.length) {
    console.log("Nothing to re-send: no accepted deals are waiting for a contract.");
} else {
    for (const deal of deals) {
        const offer = await Offer.findById(deal.acceptedOfferId);
        if (!offer) {
            console.log(`Skipped deal ${deal._id}: its accepted offer wasn't found.`);
            continue;
        }
        await publishDealAccepted({
            dealId: deal._id.toString(),
            productId: deal.productId.toString(),
            buyerId: deal.buyerId.toString(),
            farmerId: deal.farmerId.toString(),
            offerId: offer._id.toString(),
            quantity: offer.quantity,
            pricePerUnit: offer.pricePerUnit,
            unit: offer.unit,
            totalAmount: offer.quantity * offer.pricePerUnit,
        });
        console.log(`Re-sent deal ${deal._id} (${offer.quantity} ${offer.unit} at ₹${offer.pricePerUnit})`);
    }
    console.log(`\nDone. Watch the contract-service window for "DEAL ACCEPTED RECEIVED".`);
}

setTimeout(async () => {
    await mongoose.disconnect();
    process.exit(0);
}, 1500);
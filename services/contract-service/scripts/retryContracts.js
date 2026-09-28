// ============================================================
// RETRY STUCK CONTRACTS
// ------------------------------------------------------------
// Re-queues every contract still marked GENERATING, so the PDF
// worker tries again. Run from the contract-service folder
// while the contract service is running:
//
//     node scripts/retryContracts.js
// ============================================================

import dns from "node:dns";
import "dotenv/config";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { default: Contract } = await import("../src/models/Contract.js");
const { connectRabbitMQ } = await import("../src/config/rabbitmq.js");
const { publishPdfGeneration } = await import("../src/events/publisher.js");

await mongoose.connect(process.env.MONGO_URI);
await connectRabbitMQ();

const stuck = await Contract.find({ status: "GENERATING" });

if (!stuck.length) {
    console.log("Nothing to retry: no contracts are stuck in GENERATING.");
} else {
    for (const c of stuck) {
        await publishPdfGeneration({ contractId: c._id });
        console.log(`Re-queued ${c.certificateNumber} (deal ${c.dealId})`);
    }
    console.log(`\nDone. Watch the contract-service window for "Contract ready".`);
}

// give RabbitMQ a moment to send, then exit
setTimeout(async () => {
    await mongoose.disconnect();
    process.exit(0);
}, 1500);
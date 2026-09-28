// ============================================================
// PDF WORKER
// ------------------------------------------------------------
// Takes jobs from the "contract.generate" queue:
// 1. Gathers buyer, farmer, product and deal details
// 2. Builds the PDF and uploads it to Cloudinary
// 3. Marks the contract ACTIVE
// 4. Announces "contract.generated" (with the dealId)
//
// If a job fails, the contract stays GENERATING. Run
// "node scripts/retryContracts.js" to try again.
// ============================================================

import fs from "fs";
import { getChannel } from "../config/rabbitmq.js";
import { generateContractPDF } from "../utils/pdfGenerator.js";
import { getContractData } from "../services/contractData.service.js";
import { contractGeneratedPayload } from "../services/contract.service.js";
import Contract from "../models/Contract.js";
import { uploadPDF } from "../utils/cloudinary.js";
import { publishContractGenerated } from "../events/publisher.js";

const QUEUE_NAME = "contract.generate";

export const startPdfWorker = async () => {

    const channel = getChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log("📄 PDF Worker Started...");

    channel.consume(QUEUE_NAME, async (message) => {

        if (!message) return;

        let job;

        try {

            job = JSON.parse(message.content.toString());

            console.log("\n==============================");
            console.log("📥 PDF JOB RECEIVED", job.contractId);
            console.log("==============================");

            const contractData = await getContractData(job.contractId);

            if (!contractData) {
                throw new Error("Contract data not found");
            }

            const pdfPath = await generateContractPDF(contractData);
            console.log("✅ PDF generated:", pdfPath);

            const uploadResult = await uploadPDF(pdfPath);
            console.log("☁️  PDF uploaded:", uploadResult.pdfUrl);

            const contract = await Contract.findByIdAndUpdate(
                job.contractId,
                {
                    pdfUrl: uploadResult.pdfUrl,
                    pdfPublicId: uploadResult.pdfPublicId,
                    pdfFileName: uploadResult.pdfFileName,
                    status: "ACTIVE",
                    generatedAt: new Date(),
                },
                { new: true }
            );

            await publishContractGenerated(
                contractGeneratedPayload(contract, {
                    negotiationRoomId: contractData.deal?.negotiationRoomId,
                    chatId: contractData.deal?.chatId,
                })
            );

            console.log("✅ Contract ready for deal", String(contract.dealId));

            try { fs.unlinkSync(pdfPath); } catch { /* already gone */ }

            channel.ack(message);

        } catch (error) {

            console.error("\n❌ PDF Worker Error for contract", job?.contractId);
            console.error(error?.response?.data || error.message || error);
            console.error("   The contract stays GENERATING. Fix the error above, then run:");
            console.error("   node scripts/retryContracts.js\n");

            channel.nack(message, false, false);
        }
    });
};
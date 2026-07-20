// ============================================================
// PDF WORKER
// ============================================================

import { getChannel } from "../config/rabbitmq.js";
import { generateContractPDF } from "../utils/pdfGenerator.js";
import { getContractData } from "../services/contractData.service.js";
import fs from "fs";
import Contract from "../models/Contract.js";
import { uploadPDF } from "../utils/cloudinary.js";
import { publishContractGenerated } from "../events/publisher.js";
const QUEUE_NAME = "contract.generate";

export const startPdfWorker = async () => {

    const channel = getChannel();

    await channel.assertQueue(
        QUEUE_NAME,
        {
            durable: true,
        }
    );

    console.log("📄 PDF Worker Started...");

    channel.consume(

        QUEUE_NAME,

        async (message) => {

            if (!message) return;

            try {

                const job = JSON.parse(
                    message.content.toString()
                );

                console.log("\n==============================");
                console.log("📥 PDF JOB RECEIVED");
                console.log("==============================");
                console.log(job);

                // ---------------------------------------------
                // Fetch Complete Contract Data
                // ---------------------------------------------

                const contractData =
                    await getContractData(
                        job.contractId
                    );

                if (!contractData) {
                    throw new Error("Contract data not found");
                }

                // ---------------------------------------------
                // Generate PDF
                // ---------------------------------------------
                console.log(JSON.stringify(contractData, null, 2));

                const pdfPath =
    await generateContractPDF(contractData);

console.log("\n✅ PDF Generated Successfully");
console.log("📄 PDF Saved At:");
console.log(pdfPath);

// Upload to Cloudinary
const uploadResult = await uploadPDF(pdfPath);

// Update Contract
          await Contract.findByIdAndUpdate(
    job.contractId,
    {
        pdfUrl: uploadResult.pdfUrl,
        pdfPublicId: uploadResult.pdfPublicId,
        pdfFileName: uploadResult.pdfFileName,
        status: "ACTIVE",
        generatedAt: new Date(),
    }
);
await publishContractGenerated({

    contractId: job.contractId,

    certificateNumber:
        contractData.contract.certificateNumber,

    pdfUrl: uploadResult.pdfUrl,
    negotiationRoomId:contractData.deal.negotiationRoomId,

    chatId:contractData.deal.chatId,

    generatedAt: new Date()

}); generatedAt: new Date()
    

console.log("✅ Contract Updated Successfully");

// Delete Local PDF
fs.unlinkSync(pdfPath);

console.log("🗑 Local PDF Deleted");

                channel.ack(message);


            } catch (error) {

                console.error("\n❌ PDF Worker Error");
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
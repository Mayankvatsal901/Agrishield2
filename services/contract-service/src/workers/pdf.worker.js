// ============================================================
// PDF WORKER
// ------------------------------------------------------------
// Listens for "contract.generate" events.
//
// Responsibilities:
// 1. Receive PDF Job
// 2. Fetch Contract
// 3. Generate PDF
//
// (Cloudinary Upload, DB Update and Notifications
// will be added later.)
// ============================================================

import { getChannel } from "../config/rabbitmq.js";
import Contract from "../models/Contract.js";
import { generateContractPDF } from "../utils/pdfGenerator.js";
import { getContractData } from "../services/contractData.service.js";

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

                const data = JSON.parse(
                    message.content.toString()
                );

                console.log("\n==============================");
                console.log("📥 PDF JOB RECEIVED");
                console.log("==============================");

                console.log(data);

                // ----------------------------------------------------
                // Fetch Contract
                // ----------------------------------------------------

                const contract = await Contract.findById(
                    data.contractId
                );
                const data1 =
                await getContractData(
                data.contractId
                );

                if (!data1) {
                    throw new Error("Contract not found");
                }

                // ----------------------------------------------------
                // Generate PDF
                // ----------------------------------------------------

                const pdfPath = await generateContractPDF(data1);

                console.log("\n✅ PDF Generated Successfully");

                console.log("📄 PDF Saved At:");

                console.log(pdfPath);

                channel.ack(message);

            } catch (error) {

                console.error("\n❌ PDF Worker Error");

                console.error(error);

                // Don't requeue for now.
                // We'll implement retries later.
                channel.nack(
                    message,
                    false,
                    false
                );

            }

        }

    );

};
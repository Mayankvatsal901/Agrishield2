// ============================================================
// CONTRACT EVENT PUBLISHER
// ============================================================

import { getChannel } from "../config/rabbitmq.js";

const PDF_QUEUE = "contract.generate";

export const publishPdfGeneration = async (payload) => {

    const channel = getChannel();

    await channel.assertQueue(
        PDF_QUEUE,
        {
            durable: true,
        }
    );

    channel.sendToQueue(

        PDF_QUEUE,

        Buffer.from(
            JSON.stringify(payload)
        ),

        {
            persistent: true,
        }

    );

    console.log(
        "📤 PDF Generation Event Published"
    );

};
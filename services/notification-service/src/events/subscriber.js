import { getChannel } from "../config/rabbitmq.js";
import { publishNotificationCreated } from "./publisher.js";

export const subscribeContractEvents = async () => {

    const channel = getChannel();

    /*
    |--------------------------------------------------------------------------
    | Queue
    |--------------------------------------------------------------------------
    */

    const queue = "notification.contract.generated";

    await channel.assertQueue(queue, {
        durable: true,
    });

    /*
    |--------------------------------------------------------------------------
    | Binding
    |--------------------------------------------------------------------------
    */

    await channel.bindQueue(
        queue,
        "agrishield.events",
        "contract.generated"
    );

    console.log(
        "📡 Waiting for contract.generated events..."
    );

    /*
    |--------------------------------------------------------------------------
    | Consume
    |--------------------------------------------------------------------------
    */

    channel.consume(

        queue,

        async (message) => {

            if (!message) return;

            try {

                const payload = JSON.parse(
                    message.content.toString()
                );

                console.log("");

                console.log(
                    "======================================="
                );

                console.log(
                    "📄 Contract Generated"
                );

                console.log(
                    "Contract:",
                    payload.contractId
                );

                console.log(
                    "Buyer:",
                    payload.buyerId
                );

                console.log(
                    "Farmer:",
                    payload.farmerId
                );

                console.log(
                    "PDF:",
                    payload.pdfUrl
                );

                console.log(
                    "Hash:",
                    payload.blockchainHash
                );

                console.log(
                    "======================================="
                );

                /*
                |--------------------------------------------------------------------------
                | Publish Notification
                |--------------------------------------------------------------------------
                */

                await publishNotificationCreated({

                    type: "CONTRACT_GENERATED",
                
                    contractId: payload.contractId,
                
                    dealId: payload.dealId,
                
                    buyerId: payload.buyerId,
                
                    farmerId: payload.farmerId,
                
                    negotiationRoomId: payload.negotiationRoomId,
                
                    chatId: payload.chatId,
                
                    pdfUrl: payload.pdfUrl,
                
                    blockchainHash: payload.blockchainHash,
                
                });
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
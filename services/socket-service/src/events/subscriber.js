import { getChannel } from "../config/rabbitmq.js";
import { getIO } from "../config/socket.js";

import activeRooms from "../state/activeRooms.js";

export const subscribeDealEvents = async () => {

    const channel = getChannel();

    /*
    |--------------------------------------------------------------------------
    | DEAL CREATED QUEUE
    |--------------------------------------------------------------------------
    */

    const dealQueue = "socket.deal.created";

    await channel.assertQueue(dealQueue, {
        durable: true,
    });

    await channel.bindQueue(
        dealQueue,
        "agrishield.events",
        "deal.created"
    );

    console.log(
        "📡 Waiting for deal.created events..."
    );

    channel.consume(

        dealQueue,

        (message) => {

            if (!message) return;

            try {

                const payload = JSON.parse(
                    message.content.toString()
                );

                /*
                ----------------------------------------------------------
                Register Negotiation Room
                ----------------------------------------------------------
                */

                activeRooms.negotiations.set(

                    payload.negotiationRoomId,

                    {

                        dealId: payload.dealId,

                        buyerId: payload.buyerId,

                        farmerId: payload.farmerId,

                    }

                );

                /*
                ----------------------------------------------------------
                Register Chat Room
                ----------------------------------------------------------
                */

                activeRooms.chats.set(

                    payload.chatId.toString(),

                    {

                        dealId: payload.dealId,

                        buyerId: payload.buyerId,

                        farmerId: payload.farmerId,

                    }

                );

                console.log("");

                console.log(
                    "======================================="
                );

                console.log(
                    "✅ New Deal Registered"
                );

                console.log(
                    "Deal:",
                    payload.dealId
                );

                console.log(
                    "Negotiation:",
                    payload.negotiationRoomId
                );

                console.log(
                    "Chat:",
                    payload.chatId
                );

                console.log(
                    "======================================="
                );

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

    /*
    |--------------------------------------------------------------------------
    | OFFER CREATED QUEUE
    |--------------------------------------------------------------------------
    */

    const offerQueue = "socket.offer.created";

    await channel.assertQueue(offerQueue, {
        durable: true,
    });

    await channel.bindQueue(
        offerQueue,
        "agrishield.events",
        "offer.created"
    );

    console.log(
        "📡 Waiting for offer.created events..."
    );

    channel.consume(

        offerQueue,

        (message) => {

            if (!message) return;

            try {

                const payload = JSON.parse(
                    message.content.toString()
                );

                console.log("");

                console.log(
                    "======================================="
                );

                const io = getIO();

                io.to(payload.negotiationRoomId).emit(
                "offer-created",
                 payload.offer
              );
                console.log(
                    "Deal:",
                    payload.dealId
                );

                console.log(
                    "Negotiation:",
                    payload.negotiationRoomId
                );

                console.log(
                    "Offer:",
                    payload.offer._id
                );

                console.log(
                    "Offered By:",
                    payload.offer.offeredByRole
                );

                console.log(
                    "Quantity:",
                    payload.offer.quantity
                );

                console.log(
                    "Price:",
                    payload.offer.pricePerUnit
                );

                console.log(
                    "Final Offer:",
                    payload.offer.isFinalOffer
                );

                console.log(
                    "======================================="
                );

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
    
/*
|--------------------------------------------------------------------------
| NOTIFICATION CREATED QUEUE
|--------------------------------------------------------------------------
*/

const notificationQueue = "socket.notification.created";

await channel.assertQueue(notificationQueue, {
    durable: true,
});

await channel.bindQueue(
    notificationQueue,
    "agrishield.events",
    "notification.created"
);

console.log(
    "📡 Waiting for notification.created events..."
);

channel.consume(

    notificationQueue,

    (message) => {

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
                "🔔 Contract Notification Received"
            );

            console.log(
                "Contract:",
                payload.contractId
            );

            console.log(
                "Deal:",
                payload.dealId
            );

            console.log(
                "Negotiation:",
                payload.negotiationRoomId
            );

            console.log(
                "Chat:",
                payload.chatId
            );

            console.log(
                "PDF:",
                payload.pdfUrl
            );

            console.log(
                "Blockchain Hash:",
                payload.blockchainHash
            );

            console.log(
                "======================================="
            );

            /*
            ----------------------------------------------------------
            Emit Notification
            ----------------------------------------------------------
            */

            const io = getIO();

            io.to(
                payload.negotiationRoomId
            ).emit(

                "contract-generated",

                {

                    contractId: payload.contractId,

                    dealId: payload.dealId,

                    pdfUrl: payload.pdfUrl,

                    blockchainHash: payload.blockchainHash,

                    chatId: payload.chatId,

                    negotiationRoomId:
                        payload.negotiationRoomId,

                }

            );

            console.log(
                "✅ Contract notification emitted to:",
                payload.negotiationRoomId
            );

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
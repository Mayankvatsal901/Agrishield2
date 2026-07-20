import { getChannel } from "../config/rabbitmq.js";

/*
|--------------------------------------------------------------------------
| Generic Publisher
|--------------------------------------------------------------------------
*/

const publish = async (routingKey, payload) => {

    const channel = getChannel();

    channel.publish(
        "agrishield.events",
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
            persistent: true,
        }
    );

};

/*
|--------------------------------------------------------------------------
| Deal Created
|--------------------------------------------------------------------------
*/

export const publishDealCreated = async (payload) => {

    await publish(
        "deal.created",
        payload
    );

};

/*
|--------------------------------------------------------------------------
| Deal Accepted
|--------------------------------------------------------------------------
*/

export const publishDealAccepted = async (payload) => {

    await publish(
        "deal.accepted",
        payload
    );

};


export const publishOfferCreated = async (payload) => {

    await publish(

        "offer.created",

        payload

    );

};
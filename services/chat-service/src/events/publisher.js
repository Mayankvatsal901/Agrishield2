import { getChannel } from "../config/rabbitmq.js";

const EXCHANGE = "agrishield.events";

export const publishMessageCreated = async (payload) => {

    const channel = getChannel();

    channel.publish(

        EXCHANGE,

        "message.created",

        Buffer.from(JSON.stringify(payload)),

        {
            persistent: true,
        }

    );

    console.log(
        "📤 Published message.created"
    );

};
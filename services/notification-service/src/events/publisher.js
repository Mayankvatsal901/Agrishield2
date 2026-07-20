import { getChannel } from "../config/rabbitmq.js";

export const publishNotificationCreated = async (payload) => {

    const channel = getChannel();

    channel.publish(

        "agrishield.events",

        "notification.created",

        Buffer.from(
            JSON.stringify(payload)
        ),

        {
            persistent: true,
        }

    );

    console.log(
        "📤 notification.created published"
    );

};
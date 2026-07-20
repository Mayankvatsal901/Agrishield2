import amqp from "amqplib";

let channel;

const EXCHANGE = "agrishield.events";

export const connectRabbitMQ = async () => {

    try {

        const connection = await amqp.connect(

            process.env.RABBITMQ_URL

        );

        channel = await connection.createChannel();

        await channel.assertExchange(

            EXCHANGE,

            "topic",

            {

                durable: true,

            }

        );

        console.log(
            "✅ RabbitMQ Connected"
        );

    }

    catch (error) {

        console.error(

            "❌ RabbitMQ Connection Failed:",

            error.message

        );

        process.exit(1);

    }

};

export const getChannel = () => {

    if (!channel) {

        throw new Error(
            "RabbitMQ channel not initialized."
        );

    }

    return channel;

};
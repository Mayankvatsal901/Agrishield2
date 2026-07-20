import amqp from "amqplib";

let connection;
let channel;

export const connectRabbitMQ = async () => {

    try {

        connection = await amqp.connect(
            process.env.RABBITMQ_URL
        );

        channel = await connection.createChannel();

        await channel.assertExchange(
            "agrishield.events",
            "topic",
            {
                durable: true,
            }
        );

        console.log("✅ RabbitMQ Connected");

    } catch (error) {

        console.error("❌ RabbitMQ Connection Failed");

        console.error(error);

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
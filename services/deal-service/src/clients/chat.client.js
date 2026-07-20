import axios from "axios";

export const createChat = async ({
    dealId,
    buyerId,
    farmerId,
    buyerLanguage,
    farmerLanguage,
}) => {

    const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL;

    console.log("CHAT SERVICE URL =", CHAT_SERVICE_URL);

    try {

        const response = await axios.post(

            `${CHAT_SERVICE_URL}/api/chats`,

            {
                dealId,
                buyerId,
                farmerId,
                buyerLanguage,
                farmerLanguage,
            }

        );

        return response.data.data;

    } catch (error) {

        console.error("❌ Chat Service Error:");

        console.error(error.response?.data);

        console.error(error.message);

        throw error;

    }

};
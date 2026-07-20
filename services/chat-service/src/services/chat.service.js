import Chat from "../models/Chat.js";

export const createChat = async ({
    dealId,
    buyerId,
    farmerId,
    buyerLanguage,
    farmerLanguage,
}) => {

    const existingChat = await Chat.findOne({
        dealId,
    });

    if (existingChat) {
        return existingChat;
    }

    const chat = await Chat.create({
        dealId,
        buyerId,
        farmerId,
        buyerLanguage,
        farmerLanguage,
    });

    return chat;
};



export const getChat = async (chatId) => {

    const chat = await Chat.findById(chatId);

    if (!chat) {

        throw new Error("Chat not found.");

    }

    return chat;

};

export const getChatByDeal = async (dealId) => {

    const chat = await Chat.findOne({

        dealId,

    });

    if (!chat) {

        throw new Error("Chat not found.");

    }

    return chat;

};
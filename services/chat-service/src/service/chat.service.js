import Chat from "../model/Chat.js";

export const createChat = async ({
    dealId,
    buyerId,
    farmerId,
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
    });

    return chat;
};
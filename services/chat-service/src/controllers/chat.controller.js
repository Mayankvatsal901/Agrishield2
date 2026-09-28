import * as chatService from "../services/chat.service.js";

/*
|--------------------------------------------------------------------------
| CREATE CHAT (internal, called by Deal Service)
|--------------------------------------------------------------------------
| Returns chatId because Deal Service reads `chat.chatId`
| to link the chat room to the deal.
*/
export const createChat = async (req, res) => {
    try {
        const {
            dealId,
            buyerId,
            farmerId,
            buyerLanguage,
            farmerLanguage,
        } = req.body;

        const chat = await chatService.createChat({
            dealId,
            buyerId,
            farmerId,
            buyerLanguage,
            farmerLanguage,
        });

        return res.status(201).json({
            success: true,
            data: {
                chatId: chat._id,
                ...chat.toObject(),
            },
        });
    }
    catch (error) {
        console.error("❌ Create chat failed:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await chatService.getChat(chatId);

        return res.status(200).json({
            success: true,
            data: chat,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

export const getChatByDeal = async (req, res) => {
    try {
        const { dealId } = req.params;
        const chat = await chatService.getChatByDeal(dealId);

        return res.status(200).json({
            success: true,
            data: chat,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};
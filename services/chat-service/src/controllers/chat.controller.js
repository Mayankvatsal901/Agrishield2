import * as chatService from "../services/chat.service.js";

export const createChat = async (req, res) => {

    console.log(req.body);   // <-- Add this

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

    
}

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

        const chat = await chatService.getChatByDeal(
            dealId
        );

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



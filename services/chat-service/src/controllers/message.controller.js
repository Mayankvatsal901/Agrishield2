import * as messageService from "../services/message.service.js";

export const sendMessage = async (req, res) => {
    console.log("🔥 CONTROLLER HIT");

    try {

        const { senderId } = req.body;

        const {

            chatId

        } = req.params;

        const {

            message,

            messageType,

            senderRole,

            imageUrl,

            audioUrl,

        } = req.body;

        const result = await messageService.sendMessage({

            chatId,

            senderId,

            senderRole,

            message,

            messageType,

            imageUrl,

            audioUrl,

        });

        return res.status(201).json({

            success: true,

            message: "Message sent successfully.",

            data: result,

        });

    }

    catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};
export const getMessages = async (req, res) => {

    try {

        const { chatId } = req.params;

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 20;

        const result = await messageService.getMessages({

            chatId,

            page,

            limit,

        });

        return res.status(200).json({

            success: true,

            data: result,

        });

    }

    catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};


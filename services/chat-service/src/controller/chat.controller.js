import * as chatService from "../service/chat.service.js";

export const createChat = async (req, res) => {

    try {

        const chat = await chatService.createChat(req.body);

        return res.status(201).json({

            success: true,

            data: {

                chatId: chat._id,

            },

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};
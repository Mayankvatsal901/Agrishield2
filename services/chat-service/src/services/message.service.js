import Chat from "../models/Chat.js";

import Message from "../models/Message.js";
import { publishMessageCreated } from "../events/publisher.js";
import { translateText } from "../clients/translation.client.js";

   
export const sendMessage = async ({
    chatId,
    senderId,
    senderRole,
    message,
    messageType,
}) => {

    /*
    =====================================================
    Find Chat
    =====================================================
    */

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new Error("Chat not found");
    }

    /*
    =====================================================
    Find Languages
    =====================================================
    */

    let senderLanguage;
    let receiverLanguage;

    if (senderRole === "BUYER") {

        senderLanguage = chat.buyerLanguage;
        receiverLanguage = chat.farmerLanguage;

    } else {

        senderLanguage = chat.farmerLanguage;
        receiverLanguage = chat.buyerLanguage;

    }

    /*
    =====================================================
    Translation
    =====================================================
    */

    let translatedMessage = null;
    let translatedLanguage = null;

    const translationRequired =
        senderLanguage !== receiverLanguage;

    if (translationRequired) {

        console.log("🌐 Translation Required");

        const translationResponse =
            await translateText({

                text: message,

                sourceLanguage: senderLanguage,

                targetLanguage: receiverLanguage,

            });

        translatedMessage =
            translationResponse.translatedText;

        translatedLanguage =
            receiverLanguage;

    } else {

        console.log("✅ Translation Not Required");

    }

    /*
    =====================================================
    Save Message
    =====================================================
    */

    const newMessage = await Message.create({

        chatId,

        senderId,

        senderRole,

        originalMessage: message,

        translatedMessage,

        translatedLanguage,

        messageType,

    });

    /*
    =====================================================
    Update Chat
    =====================================================
    */

    chat.lastMessage = newMessage._id;

    chat.lastMessageAt = new Date();

    await chat.save();

    /*
    =====================================================
    Publish Event
    =====================================================
    */

    await publishMessageCreated({

        _id: newMessage._id,

        chatId: newMessage.chatId,

        senderId: newMessage.senderId,

        senderRole: newMessage.senderRole,

        originalMessage: newMessage.originalMessage,

        translatedMessage: newMessage.translatedMessage,

        translatedLanguage: newMessage.translatedLanguage,

        messageType: newMessage.messageType,

        createdAt: newMessage.createdAt,

    });

    return newMessage;

};;
   

export const getMessages = async ({

    chatId,

    page,

    limit,

}) => {

    const chat = await Chat.findById(chatId);

    if (!chat) {

        throw new Error("Chat not found.");

    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({

        chatId,

    })

        .sort({

            createdAt: 1,

        })

        .skip(skip)

        .limit(limit);

    const totalMessages = await Message.countDocuments({

        chatId,

    });

    return {

        messages,

        pagination: {

            page,

            limit,

            totalMessages,

            totalPages: Math.ceil(totalMessages / limit),

        },

    };

};
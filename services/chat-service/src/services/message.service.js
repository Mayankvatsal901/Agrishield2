import Chat from "../models/Chat.js";

import Message from "../models/Message.js";
import { publishMessageCreated } from "../events/publisher.js";
import { translateText } from "../clients/translation.client.js";
import { speechToText } from "../clients/translation.client.js";


   
export const sendMessage = async ({
    chatId,
    senderId,
    senderRole,
    message,
    messageType,
    audioFile,
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
    Process Voice
    =====================================================
    */

    let finalMessage = message;

    let audioUrl = null;

    if (messageType === "VOICE") {

        if (!audioFile) {
            throw new Error("Voice file is required.");
        }

        console.log("🎤 Voice Message Received");

        /*
        -----------------------------------------------------
        Upload audio to Cloudinary (Next Step)
        -----------------------------------------------------
        */

        // audioUrl = await uploadAudio(audioFile);

        /*
        -----------------------------------------------------
        Speech To Text
        -----------------------------------------------------
        */

        try {
            console.log("🎤 Calling Speech-to-Text...");
            console.log("📄 File Details:", {
                originalname: audioFile.originalname,
                mimetype: audioFile.mimetype,
                size: audioFile.size,
            });
        
            const transcript = await speechToText(audioFile);
        
            console.log("✅ Speech-to-Text Response:", transcript);
        
            finalMessage = transcript.text;
        
        } catch (error) {
            console.error("❌ Speech-to-Text Error");
        
            console.error("Message:", error.message);
        
            if (error.code) {
                console.error("Code:", error.code);
            }
        
            if (error.config) {
                console.error("Request URL:", error.config.baseURL + error.config.url);
                console.error("Base URL:", error.config.baseURL);
                console.error("Endpoint:", error.config.url);
            }
        
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Response Data:", error.response.data);
            }
        
            throw error;
        }

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

                text: finalMessage,

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

        messageType,

        originalMessage: finalMessage,

        translatedMessage,

        translatedLanguage,

        audioUrl,

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

        audioUrl: newMessage.audioUrl,

        messageType: newMessage.messageType,

        createdAt: newMessage.createdAt,

    });

    return newMessage;

};

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
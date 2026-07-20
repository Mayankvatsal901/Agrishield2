import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(

    {

        /*
        |--------------------------------------------------------------------------
        | Chat
        |--------------------------------------------------------------------------
        */

        chatId: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Chat",

            required: true,

            index: true,

        },

        /*
        |--------------------------------------------------------------------------
        | Sender
        |--------------------------------------------------------------------------
        */

        senderId: {

            type: mongoose.Schema.Types.ObjectId,

            required: true,

        },

        senderRole: {

            type: String,

            enum: [

                "BUYER",

                "FARMER",

            ],

            required: true,

        },

        /*
        |--------------------------------------------------------------------------
        | Message Type
        |--------------------------------------------------------------------------
        */

        messageType: {

            type: String,

            enum: [

                "TEXT",

                "IMAGE",

                "VOICE",

            ],

            default: "TEXT",

        },

        /*
        |--------------------------------------------------------------------------
        | Original Message
        |--------------------------------------------------------------------------
        */

        originalMessage: {

            type: String,

            default: null,

        },

        /*
        |--------------------------------------------------------------------------
        | Translated Message
        |--------------------------------------------------------------------------
        */

        translatedMessage: {

            type: String,

            default: null,

        },

        translatedLanguage: {

            type: String,

            default: null,

        },

        /*
        |--------------------------------------------------------------------------
        | Media
        |--------------------------------------------------------------------------
        */

        imageUrl: {

            type: String,

            default: null,

        },

        audioUrl: {

            type: String,

            default: null,

        },

        /*
        |--------------------------------------------------------------------------
        | Message Status
        |--------------------------------------------------------------------------
        */

        status: {

            type: String,

            enum: [

                "SENT",

                "DELIVERED",

                "READ",

            ],

            default: "SENT",

        },

        /*
        |--------------------------------------------------------------------------
        | Future
        |--------------------------------------------------------------------------
        */

        isEdited: {

            type: Boolean,

            default: false,

        },

        isDeleted: {

            type: Boolean,

            default: false,

        },

    },

    {

        timestamps: true,

    }

);

export default mongoose.model(
    "Message",
    messageSchema
);
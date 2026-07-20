import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(

    {

        dealId: {

            type: mongoose.Schema.Types.ObjectId,

            required: true,

            unique: true,

        },

        buyerId: {

            type: mongoose.Schema.Types.ObjectId,

            required: true,

        },
      

        farmerId: {

            type: mongoose.Schema.Types.ObjectId,

            required: true,

        },
        buyerLanguage: {
            type: String,
            required: true,
        },
        
        farmerLanguage: {
            type: String,
            required: true,
        },

        lastMessageAt: {

            type: Date,

            default: Date.now,

        },

    },

    {

        timestamps: true,

    }

);

export default mongoose.model(
    "Chat",
    chatSchema
);
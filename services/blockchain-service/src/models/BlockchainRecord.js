import mongoose from "mongoose";

const blockchainRecordSchema = new mongoose.Schema(

    {

        contractId: {

            type: mongoose.Schema.Types.ObjectId,

            required: true,

            unique: true,

        },

        certificateNumber: {

            type: String,

            required: true,

            unique: true,

        },

        pdfUrl: {

            type: String,

            required: true,

        },

        hash: {

            type: String,

            required: true,

            unique: true,

        },

        transactionHash: {

            type: String,

            required: true,

            unique: true,

        },

        algorithm: {

            type: String,

            default: "SHA-256",

        },

        verified: {

            type: Boolean,

            default: true,

        }

    },

    {

        timestamps: true,

    }

);

export default mongoose.model(
    "BlockchainRecord",
    blockchainRecordSchema
);
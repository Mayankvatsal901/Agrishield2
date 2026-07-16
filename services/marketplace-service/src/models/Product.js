import mongoose from "mongoose";

const productSchema = new mongoose.Schema(

    {

        farmerId: {

            type: mongoose.Schema.Types.ObjectId,

            required: true,

            index: true,

        },

        name: {

            type: String,

            required: true,

            trim: true,

        },

        description: {

            type: String,

            required: true,

            trim: true,

        },

        category: {

            type: String,

            required: true,

        },

        price: {

            type: Number,

            required: true,

            min: 0,

        },

        quantity: {

            type: Number,

            required: true,

            min: 1,

        },

        unit: {

            type: String,

            enum: [

                "KG",

                "QUINTAL",

                "TON",

                "PIECE",

                "PACKET"

            ],

            required: true,

        },

        images: [

            {

                type: String,

            }

        ],

        location: {

            type: String,

            required: true,

        },

        harvestDate: {

            type: Date,

            required: true,

        },

        organic: {

            type: Boolean,

            default: false,

        },

        status: {

            type: String,

            enum: [

                "ACTIVE",

                "UNDER_NEGOTIATION",

                "RESERVED",

                "SOLD",

                "ARCHIVED",
                
                "DELETE",

            ],

            default: "ACTIVE",

        },

    },

    {

        timestamps: true,

    }

);

const Product = mongoose.model(
    "Product",
    productSchema
);

export default Product;
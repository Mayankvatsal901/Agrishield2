import mongoose from "mongoose";

const buyerProfileSchema = new mongoose.Schema(
  {
    // Reference to Auth Service User (_id)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    companyName: {
        type: String,
        trim: true,
        default: ""
    },

    businessType: {
      type: String,
      enum: [
        "Wholesaler",
        "Retailer",
        "Exporter",
        "Food Processing",
        "Restaurant",
        "Individual",
        "Other",
      ],
      required: true,
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    licenseNumber: {
      type: String,
      trim: true,
      default: "",
    },

     isVerifiedBuyer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const BuyerProfile = mongoose.model("BuyerProfile", buyerProfileSchema);

export default BuyerProfile;
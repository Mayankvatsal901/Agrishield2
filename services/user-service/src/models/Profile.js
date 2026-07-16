import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    // Reference to the Auth Service User (_id)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"],
    },

    profileImage: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      enum: [
        "en",
        "hi",
        "as",
        "bn",
        "gu",
        "kn",
        "ml",
        "mr",
        "or",
        "pa",
        "ta",
        "te",
        "ur",
      ],
      default: "en",
    },

    address: {
      state: {
        type: String,
        required: true,
        trim: true,
      },

      district: {
        type: String,
        required: true,
        trim: true,
      },

      village: {
        type: String,
        trim: true,
        default: "",
      },

      pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, "Invalid pincode"],
      },
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
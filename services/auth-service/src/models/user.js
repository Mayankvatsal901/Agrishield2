import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "LOCAL";
      },
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["FARMER", "BUYER", "ADMIN"],
      required: true,
    },

    provider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },

    googleId: {
      type: String,
      default: null,
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
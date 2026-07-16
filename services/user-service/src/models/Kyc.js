import mongoose from "mongoose";

const kycSchema = new mongoose.Schema(
  {
    // User Id from Auth Service
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    // Uploaded Documents
    documents: {
      aadhaar: {
        front: {
          type: String,
          default: "",
        },

        back: {
          type: String,
          default: "",
        },
      },

      pan: {
        image: {
          type: String,
          default: "",
        },
      },
    },

    // OCR Extracted Data
    ocrData: {
      aadhaar: {
        name: {
          type: String,
          default: "",
        },

        dob: {
          type: String,
          default: "",
        },

        gender: {
          type: String,
          default: "",
        },

        aadhaarNumber: {
          type: String,
          default: "",
        },
      },

      pan: {
        name: {
          type: String,
          default: "",
        },

        panNumber: {
          type: String,
          default: "",
        },

        fatherName: {
          type: String,
          default: "",
        },

        dob: {
          type: String,
          default: "",
        },
      },
    },

    // OCR Processing
    ocrStatus: {
      type: String,
      enum: ["NOT_STARTED", "PROCESSING", "COMPLETED", "FAILED"],
      default: "NOT_STARTED",
  },

    ocrConfidence: {
      type: Number,
      default: 0,
    },

    // KYC Verification Status
    status: {
      type: String,
      enum: [
        "NOT_SUBMITTED",
        "PENDING",
        "APPROVED",
        "REJECTED",
      ],
      default: "NOT_SUBMITTED",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    // Admin who approved/rejected
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // Last submission time
    lastSubmittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const KYC = mongoose.model("KYC", kycSchema);

export default KYC;
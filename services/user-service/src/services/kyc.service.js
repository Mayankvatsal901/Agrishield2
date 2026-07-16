import KYC from "../models/KYC.js";
import * as mlClient from "../clients/ml.client.js";

export const uploadKYC = async (userId, kycData) => {

    const {
        aadhaarFront,
        aadhaarBack,
        panCard,
    } = kycData;

    if (!aadhaarFront || !aadhaarBack || !panCard) {
        throw new Error("Please upload all required documents.");
    }
    const documents = {

        aadhaar: {
    
            front: aadhaarFront,
    
            back: aadhaarBack,
    
        },
    
        pan: {
    
            image: panCard,
    
        }
    
    };
    
    const ocrResult = await mlClient.extractKYC(documents);
    

    const existingKYC = await KYC.findOne({ userId });

    if (existingKYC) {

        existingKYC.documents = {

            aadhaar: {
                front: aadhaarFront,
                back: aadhaarBack,
            },

            pan: {
                image: panCard,
            },

        };

        existingKYC.status = "PENDING";
        existingKYC.rejectionReason = "";
        existingKYC.verifiedBy = null;
        existingKYC.verifiedAt = null;
        existingKYC.ocrData = ocrResult.ocrData;

    
        existingKYC.ocrStatus = ocrResult.ocrStatus;

        existingKYC.ocrConfidence = ocrResult.ocrConfidence;
        existingKYC.lastSubmittedAt = new Date();

        await existingKYC.save();

        return existingKYC;
    }

    const kyc = await KYC.create({

        userId,
    
        documents:{
    
            aadhaar:{
                front:aadhaarFront,
                back:aadhaarBack,
            },
    
            pan:{
                image:panCard,
            }
    
        },
    
        ocrData: ocrResult.ocrData,
    
        ocrStatus: ocrResult.ocrStatus,
    
        ocrConfidence: ocrResult.ocrConfidence,
    
        status:"PENDING",
    
        lastSubmittedAt:new Date()
    
    });

}

export const getKYC = async (userId) => {

    const kyc = await KYC.findOne({ userId });

    if (!kyc) {

        return {

            status: "NOT_SUBMITTED",

            documents: null,

            rejectionReason: "",

            verifiedAt: null,

            ocrStatus: "PENDING",

            ocrConfidence: 0,

            ocrData: null,

        };

    }

    return {

        status: kyc.status,

        documents: {

            aadhaar: {

                front: kyc.documents.aadhaar.front,

                back: kyc.documents.aadhaar.back,

            },

            pan: {

                image: kyc.documents.pan.image,

            },

        },

        ocrData: kyc.ocrData,

        ocrStatus: kyc.ocrStatus,

        ocrConfidence: kyc.ocrConfidence,

        rejectionReason: kyc.rejectionReason,

        verifiedAt: kyc.verifiedAt,

    };

}


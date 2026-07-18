import BlockchainRecord from "../models/BlockchainRecord.js";

import { contract } from "../config/ethereum.js";
import { downloadPdf } from "../utils/downloadPdf.js";

import { generateSHA256Hash } from "../utils/hash.js";

/**
 * Store hash on blockchain
 */
export const storeHashOnBlockchain = async (certificateNumber, hash) => {
    try {

        console.log("⛏️ Storing hash on blockchain...");

        const tx = await contract.storeHash(
            certificateNumber,
            hash
        );

        console.log("Transaction Submitted:");
        console.log(tx.hash);

        await tx.wait();

        console.log("✅ Hash stored successfully!");

        return {
            success: true,
            transactionHash: tx.hash
        };

    } catch (error) {

        console.error("Error storing hash:", error);

        throw error;
    }
};


/**
 * Verify hash
 */
export const verifyHashOnBlockchain = async (certificateNumber, hash) => {

    try {

        return await contract.verifyHash(
            certificateNumber,
            hash
        );

    } catch (error) {

        console.error(error);

        throw error;
    }

};


/**
 * Get stored hash
 */
export const getHashFromBlockchain = async (certificateNumber) => {

    try {

        return await contract.getHash(
            certificateNumber
        );

    } catch (error) {

        console.error(error);

        throw error;
    }

};

export const processContractGenerated = async (contractData) => {

    try {

        console.log("\n====================================");
        console.log("📄 Processing Contract Generated Event");
        console.log("====================================");

        // -------------------------------------------------
        // Extract Data
        // -------------------------------------------------

        const {

            contractId,
            certificateNumber,
            pdfUrl

        } = contractData;

        // -------------------------------------------------
        // Download PDF
        // -------------------------------------------------

        console.log("⬇️ Downloading PDF...");

        const pdfBuffer = await downloadPdf(pdfUrl);

        console.log("✅ PDF Downloaded");

        // -------------------------------------------------
        // Generate SHA-256 Hash
        // -------------------------------------------------

        console.log("🔐 Generating SHA-256 Hash...");

        const hash = generateSHA256Hash(pdfBuffer);

        console.log("Hash :", hash);

        // -------------------------------------------------
        // Store Hash on Blockchain
        // -------------------------------------------------

        const blockchainResult = await storeHashOnBlockchain(

            certificateNumber,
            hash

        );

        // -------------------------------------------------
        // Save MongoDB Record
        // -------------------------------------------------

        await BlockchainRecord.create({

            contractId,

            certificateNumber,

            pdfUrl,

            hash,

            algorithm: "SHA-256",

            transactionHash:
                blockchainResult.transactionHash,

            verified: true

        });

        console.log("✅ Blockchain Record Saved");

        console.log("====================================\n");

        return blockchainResult;

    }

    catch (error) {

        console.error(
            "❌ Blockchain Processing Error:",
            error
        );

        throw error;

    }

};
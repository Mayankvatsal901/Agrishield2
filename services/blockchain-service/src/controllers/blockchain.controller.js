import {

    getHashFromBlockchain

} from "../services/blockchain.service.js";

import {

    generateSHA256Hash

} from "../utils/hash.js";

import BlockchainRecord from "../models/BlockchainRecord.js";

export const verifyCertificate = async (req, res) => {

    try {

        const { certificateNumber } = req.body;

        if (!certificateNumber) {

            return res.status(400).json({

                success: false,

                message: "Certificate Number is required."

            });

        }

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "PDF is required."

            });

        }

        const uploadedHash = generateSHA256Hash(req.file.buffer);

        const blockchainHash = await getHashFromBlockchain(

            certificateNumber

        );

        const blockchainRecord = await BlockchainRecord.findOne({

            certificateNumber

        });

        const valid = blockchainHash === uploadedHash;

        return res.status(200).json({

            success: true,

            valid,

            certificateNumber,

            blockchainHash,

            uploadedHash,

            transactionHash:

                blockchainRecord?.transactionHash,

            network: "Sepolia",

            verifiedAt: new Date(),

            explorerUrl: blockchainRecord

                ? `https://sepolia.etherscan.io/tx/${blockchainRecord.transactionHash}`

                : null

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
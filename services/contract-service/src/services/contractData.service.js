// ============================================================
// CONTRACT DATA SERVICE
// ------------------------------------------------------------
// Aggregates all information required to generate
// the Contract Certificate.
//
// Sources
// 1. Contract Database
// 2. User Service
// 3. Marketplace Service
// ============================================================

import axios from "axios";

import Contract from "../models/Contract.js";





export const getContractData = async (contractId) => {

    // --------------------------------------------------------
    // Fetch Contract
    // --------------------------------------------------------
    console.log("ENV CHECK");
console.log(process.env.USER_SERVICE_URL);
console.log(process.env.MARKETPLACE_SERVICE_URL);

const USER_SERVICE =
    process.env.USER_SERVICE_URL;

const MARKETPLACE_SERVICE =
    process.env.MARKETPLACE_SERVICE_URL;

    const contract = await Contract.findById(contractId);

    if (!contract) {

        throw new Error("Contract not found");

    }

    // --------------------------------------------------------
    // Fetch Buyer
    // --------------------------------------------------------
    console.log("Fetching Buyer...");
    console.log(`${USER_SERVICE}/api/internal/users/${contract.buyerId}`);
    const buyerResponse =
        await axios.get(

            `${USER_SERVICE}/api/internal/users/${contract.buyerId}`

        );
        console.log("Buyer fetched successfully");
    // --------------------------------------------------------
    // Fetch Farmer
    // --------------------------------------------------------
    console.log("Fetching Farmer...");
    const farmerResponse =
        await axios.get(

            `${USER_SERVICE}/api/internal/users/${contract.farmerId}`

        );
        console.log("Farmer fetched successfully");

    // --------------------------------------------------------
    // Fetch Product
    // --------------------------------------------------------
    console.log("Fetching Product...");
    const productResponse =
        await axios.get(

            `${MARKETPLACE_SERVICE}/api/internal/products/${contract.productId}`

        );

        console.log("Product fetched successfully");

    // --------------------------------------------------------
    // Return Complete Data
    // --------------------------------------------------------

    return {

        contract,

        buyer: buyerResponse.data.data,

        farmer: farmerResponse.data.data,

        product: productResponse.data.data,

    };

};
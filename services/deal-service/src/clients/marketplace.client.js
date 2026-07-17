import axios from "axios";

/*
|--------------------------------------------------------------------------
| MARKETPLACE SERVICE CLIENT
|--------------------------------------------------------------------------
| Purpose:
| Allows Deal Service to communicate with Marketplace Service.
|
| Deal Service does NOT directly access the Marketplace database.
| Instead, it calls Marketplace Service through an internal API.
|
| Used when:
| Buyer wants to create/start a Deal Room for a product.
|
| Flow:
|
| Deal Service
|      ↓ productId
| Marketplace Service
|      ↓
| Product Details
|      ↓
| farmerId
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET PRODUCT DETAILS
|--------------------------------------------------------------------------
| Fetches a product from Marketplace Service using its product ID.
|
| This allows Deal Service to:
| 1. Check whether the product exists.
| 2. Get the farmerId who owns the product.
| 3. Check whether the product can currently be negotiated.
|--------------------------------------------------------------------------
*/

export const getProductDetails = async (productId) => {

    try {

        const response = await axios.get(
            `${process.env.MARKETPLACE_SERVICE_URL}/api/internal/products/${productId}`
        );

        return response.data.data;

    } catch (error) {

        // Marketplace Service returned an error response
        if (error.response) {

            throw new Error(
                error.response.data.message ||
                "Unable to fetch product details."
            );

        }

        // Marketplace Service could not be reached
        throw new Error(
            "Unable to connect to Marketplace Service."
        );

    }

};
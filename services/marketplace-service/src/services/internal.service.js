import Product from "../models/Product.js";

/*
|--------------------------------------------------------------------------
| GET PRODUCT FOR INTERNAL SERVICES
|--------------------------------------------------------------------------
| Purpose:
| Fetch product details for other microservices such as Deal Service.
|
| This allows Deal Service to verify:
| - Product exists
| - Product owner (farmerId)
| - Product status
| - Available quantity
|--------------------------------------------------------------------------
*/

export const getProductForInternalService = async (productId) => {

    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found.");
    }

    return product;
};
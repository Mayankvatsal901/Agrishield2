import Product from "../models/Product.js";
import { checkFarmerEligibility } from "../clients/user.client.js";

export const createProduct = async (req) => {

    const {

        name,

        description,

        category,

        price,

        quantity,

        unit,

        location,

        harvestDate,

        organic,

    } = req.body;

    // ------------------------
    // Validation
    // ------------------------
    console.log(req.body);
    if (
        !name ||
        !description ||
        !category ||
        !price ||
        !quantity ||
        !unit ||
        !location ||
        !harvestDate
    ) {

        throw new Error("All fields are required.");

    }

    // ------------------------
    // Images
    // ------------------------

    if (!req.files || req.files.length === 0) {

        throw new Error("Please upload at least one product image.");

    }

    const images = req.files.map(file => file.path);

    // ------------------------
    // TODO
    // Check Farmer KYC
    // ------------------------
    const farmer = await checkFarmerEligibility(
        req.headers.authorization
    );
    
    if (!farmer.canSell) {
    
        throw new Error(farmer.reason);
    
    }
    const product = await Product.create({

        farmerId: req.user.userId,

        name,

        description,

        category,

        price,

        quantity,

        unit,

        location,

        harvestDate,

        organic,

        images,

    });

    return product;

};

export const getMyProducts = async (farmerId) => {

    return await Product.find({

        farmerId,

    }).sort({

        createdAt: -1,

    });

};

export const getProductById = async (productId) => {

    const product = await Product.findById(productId);

    if (!product) {

        throw new Error("Product not found.");

    }

    if (product.status === "DELETED") {

        throw new Error("Product not found.");

    }

    return product;

};

export const updateProduct = async (req) => {

    const product = await Product.findById(
        req.params.productId
    );

    if (!product) {

        throw new Error("Product not found.");

    }

    if (
        product.farmerId.toString() !==
        req.user.userId
    ) {

        throw new Error("Unauthorized.");

    }

    
      product.name = req.body.name ?? product.name;
     product.description = req.body.description ?? product.description;
     product.category = req.body.category ?? product.category;
      product.price = req.body.price ?? product.price;
       product.quantity = req.body.quantity ?? product.quantity;
     product.unit = req.body.unit ?? product.unit;
     product.location = req.body.location ?? product.location;
     product.harvestDate = req.body.harvestDate ?? product.harvestDate;
     product.organic = req.body.organic ?? product.organic;

if (req.files?.length > 0) {
    product.images = req.files.map(file => file.path);
}

await product.save();

    return product;


};

export const deleteProduct = async (req) => {

    const product = await Product.findById(
        req.params.productId
    );

    if (!product) {

        throw new Error("Product not found.");

    }

    if (
        product.farmerId.toString() !==
        req.user.userId
    ) {

        throw new Error("Unauthorized.");

    }

    product.status = "DELETED";

    await product.save();

};
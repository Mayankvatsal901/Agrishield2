import Product from "../models/Product.js";

export const browseMarketplace = async (queryParams) => {

    const {

        search,

        category,

        location,

        organic,

        sort,

        page = 1,

        limit = 10,

    } = queryParams;

    const query = {

        status: "ACTIVE",

    };

    // ----------------------
    // Search
    // ----------------------

    if (search) {

        query.name = {

            $regex: search,

            $options: "i",

        };

    }

    // ----------------------
    // Category
    // ----------------------

    if (category) {

        query.category = category;

    }

    // ----------------------
    // Location
    // ----------------------

    if (location) {

        query.location = {

            $regex: location,

            $options: "i",

        };

    }

    // ----------------------
    // Organic
    // ----------------------

    if (organic !== undefined) {

        query.organic = organic === "true";

    }

    // ----------------------
    // Sorting
    // ----------------------

    let sortOption = {

        createdAt: -1,

    };

    switch (sort) {

        case "priceAsc":

            sortOption = {

                price: 1,

            };

            break;

        case "priceDesc":

            sortOption = {

                price: -1,

            };

            break;

        case "newest":

            sortOption = {

                createdAt: -1,

            };

            break;

        case "oldest":

            sortOption = {

                createdAt: 1,

            };

            break;

    }

    const pageNumber = Number(page);

    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(query)

        .select(

            "name category price quantity unit location images organic"

        )

        .sort(sortOption)

        .skip(skip)

        .limit(limitNumber);

    const totalProducts = await Product.countDocuments(query);

    return {

        products,

        pagination: {

            totalProducts,

            currentPage: pageNumber,

            totalPages: Math.ceil(

                totalProducts / limitNumber

            ),

            limit: limitNumber,

        },

    };

};

export const getProductDetails = async (productId) => {

    const product = await Product.findById(productId);

    if (!product) {

        throw new Error("Product not found.");

    }

    if (product.status !== "ACTIVE") {

        throw new Error("Product is not available.");

    }

    return product;

};
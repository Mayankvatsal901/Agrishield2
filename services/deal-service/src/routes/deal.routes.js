import express from "express";

import authMiddleware from "../../../../shared/middleware/authMiddleware.js";

import {
    createDeal,
    getMyDeals,
} from "../controllers/deal.controller.js";


const router = express.Router();


/*
|--------------------------------------------------------------------------
| START / CREATE DEAL
|--------------------------------------------------------------------------
| POST /api/deals
| Body: { "productId": "PRODUCT_ID" }
|--------------------------------------------------------------------------
*/
router.post(
    "/",
    authMiddleware,
    createDeal
);


/*
|--------------------------------------------------------------------------
| MY DEALS
|--------------------------------------------------------------------------
| GET /api/deals/my
|
| Every deal where the logged-in user is the buyer OR the farmer.
| This is how a farmer finds out a buyer has started negotiating.
|--------------------------------------------------------------------------
*/
router.get(
    "/my",
    authMiddleware,
    getMyDeals
);


export default router;
import express from "express";

import authMiddleware from "../../../../shared/middleware/authMiddleware.js";

import {
    createDeal,
} from "../controllers/deal.controller.js";


const router = express.Router();


/*
|--------------------------------------------------------------------------
| START / CREATE DEAL
|--------------------------------------------------------------------------
| POST /api/deals
|
| Only an authenticated user can start a Deal Room.
|
| Body:
| {
|     "productId": "PRODUCT_ID"
| }
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    createDeal
);





export default router;
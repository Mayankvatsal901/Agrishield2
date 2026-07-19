import express from "express";

import {

    verifyCertificate

} from "../controllers/blockchain.controller.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(

    "/verify",

    upload.single("pdf"),

    verifyCertificate

);

export default router;
import express from "express";

import { extractKYC } from "../controllers/ocr.controller.js";

const router = express.Router();

router.post(
    "/kyc",
    extractKYC
);

export default router;
import express from "express";

import authMiddleware from "../../../../shared/auth/auth.middleware.js";

import { uploadKYC ,getKYC} from "../controllers/kyc.controller.js"
import upload from "../../../../shared/cloudinary/upload.middleware.js";


const router = express.Router();

router.post(
    "/",
    authMiddleware,

    upload.fields([
        {
            name: "aadhaarFront",
            maxCount: 1,
        },
        {
            name: "aadhaarBack",
            maxCount: 1,
        },
        {
            name: "panCard",
            maxCount: 1,
        },
    ]),

    uploadKYC
);


router.get(
    "/",
    authMiddleware,
    getKYC
);





export default router;
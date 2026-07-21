import express from "express";
import upload from "../middleware/upload.middleware.js";

import {
    translate,speechToTextController
} from "../controllers/translation.controller.js";

const router = express.Router();

router.post(
    "/translate",
    translate
);

router.post(

    "/speech-to-text",

    upload.single("audio"),

    speechToTextController

);

export default router;
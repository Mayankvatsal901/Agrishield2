import express from "express";

import { createChat } from "../controller/chat.controller.js";

const router = express.Router();

router.post(
    "/",
    createChat
);

export default router;
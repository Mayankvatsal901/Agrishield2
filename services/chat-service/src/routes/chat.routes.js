import express from "express";

import {
    createChat,
    getChat,getChatByDeal,
} from "../controllers/chat.controller.js";

import {
    sendMessage,
    getMessages,
    } from "../controllers/message.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Chat Routes
|--------------------------------------------------------------------------
*/

// Create a new chat
router.post(
    "/",
    createChat
);

// Get chat details
router.get(
    "/:chatId",
    getChat
);

/*
|--------------------------------------------------------------------------
| Message Routes
|--------------------------------------------------------------------------
*/

// Send a message
router.post(
    "/:chatId/messages",
    upload.single("audio"),
    sendMessage
);
console.log("✅ Chat routes loaded");
 
// Get all messages of a chat
router.get(
    "/:chatId/messages",
    getMessages
);

router.get(
    "/deal/:dealId",
    getChatByDeal
);

export default router;
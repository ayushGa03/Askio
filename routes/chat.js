import express from "express";
import { chat, getChats, deleteChat, getMesssages, deleteMessage } from "../controllers/chat.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", verifyToken, chat);
router.get("/chats", verifyToken, getChats);
router.get("/:ChatID", verifyToken, getMesssages);
router.delete("/chat/:ChatID", verifyToken, deleteChat);
router.delete("/message/:MessageID", verifyToken, deleteMessage);

export default router;
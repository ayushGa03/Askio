import { generateResponse, genTiitle } from "../aiServices/gemini.js";
import { searchWeb } from "../aiServices/tavilyService.js";
import chatModel from "../models/Chat.js";
import messageModel from "../models/Message.js";
import { getIO } from "../src/sokets/soketsio.js";

// ── Main chat handler ────────────────────────────────────────────
export async function chat(req, res) {
  try {
    const { chat, ChatId, useWebSearch = false } = req.body;
    const userId = req.user.userId;

    let createdChat = null;
    let titleGenerated = null;

    // NEW CHAT
    if (!ChatId) {
      titleGenerated = await genTiitle(chat);
      createdChat = await chatModel.create({ user: userId, title: titleGenerated });
    } else {
      // EXISTING CHAT
      const existingChat = await chatModel.findOne({ _id: ChatId });
      if (existingChat) {
        titleGenerated = existingChat.title;
      } else {
        // Invalid ChatId → create a fresh chat
        titleGenerated = await genTiitle(chat);
        createdChat = await chatModel.create({ user: userId, title: titleGenerated });
      }
    }

    const chatRef = createdChat?._id || ChatId;

    // Previous messages (for conversation history)
    const previousMessages = await messageModel.find({ chatID: chatRef });

    // ── Web search (Tavily) ──────────────────────────────────────
    let webContext = "";
    let sources = [];
    if (useWebSearch) {
      const result = await searchWeb(chat);
      webContext = result.context;
      sources = result.sources;
    }

    // ── Generate AI response ─────────────────────────────────────
    const chatResponse = await generateResponse(chat, previousMessages, webContext);

    if (!chatResponse) {
      return res.status(400).json({ success: false, message: "Failed to generate response" });
    }

    // Save user message
    const savedUserMsg = await messageModel.create({
      chatID: chatRef,
      role: "userMessage",
      Message: chat,
    });

    // Save AI message
    const savedAiMsg = await messageModel.create({
      chatID: chatRef,
      role: "Ai",
      Message: chatResponse,
    });

    // ── Emit real-time event to user's private socket room ────────
    try {
      const io = getIO();
      io.to(`user_${userId}`).emit("ai:response", {
        chatId: chatRef,
        title: titleGenerated ?? "New Chat",
        aiMessage: chatResponse,
        isNewChat: !!createdChat,
        sources,
      });
    } catch (_) {
      // socket not connected – HTTP response handles it
    }

    return res.status(200).json({
      success: true,
      chatId: chatRef,
      title: titleGenerated ?? "New Chat",
      aiMessage: chatResponse,
      sources,                    // Tavily citations (empty array if no web search)
      userMessageId: savedUserMsg._id,
      aiMessageId: savedAiMsg._id,
    });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
}

// ── Get all chats for logged-in user ────────────────────────────
export async function getChats(req, res) {
  const userId = req.user.userId;
  try {
    const chatsFound = await chatModel.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, chats: chatsFound });
  } catch (err) {
    return res.status(400).json({ message: "Error fetching chats", error: err });
  }
}

// ── Get messages for a specific chat ────────────────────────────
export async function getMesssages(req, res) {
  const { ChatID } = req.params;
  try {
    const FindChat = await chatModel.findOne({ _id: ChatID, user: req.user.userId });
    if (!FindChat) return res.status(401).json({ message: "Chat not found" });

    const findMessgaes = await messageModel.find({ chatID: ChatID }).sort({ createdAt: 1 });
    return res.status(200).json({ status: "true", chat: FindChat, msg: findMessgaes });
  } catch (err) {
    return res.status(400).json({ message: "Error fetching messages", error: err });
  }
}

// ── Delete an entire chat + all its messages ────────────────────
export async function deleteChat(req, res) {
  const { ChatID } = req.params;
  const userId = req.user.userId;
  try {
    const chat = await chatModel.findOneAndDelete({ _id: ChatID, user: userId });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found or unauthorized" });
    await messageModel.deleteMany({ chatID: ChatID });
    return res.status(200).json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Error deleting chat", error: err });
  }
}

// ── Delete a single message ──────────────────────────────────────
export async function deleteMessage(req, res) {
  const { MessageID } = req.params;
  const userId = req.user.userId;
  try {
    // Find the message first
    const message = await messageModel.findById(MessageID);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Verify the message belongs to a chat owned by this user
    const chatOwned = await chatModel.findOne({ _id: message.chatID, user: userId });
    if (!chatOwned) return res.status(403).json({ success: false, message: "Unauthorized" });

    await messageModel.findByIdAndDelete(MessageID);
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Error deleting message", error: err });
  }
}
const express = require("express");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Trip = require("../models/Trip");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// OPTIONAL: keep this but not used in demo
async function areUsersMatched(userId1, userId2) {
  const user1Trips = await Trip.find({ user: userId1 });
  const user2Trips = await Trip.find({ user: userId2 });

  for (const trip1 of user1Trips) {
    for (const trip2 of user2Trips) {
      const sameDestination =
        String(trip1.destination).trim().toLowerCase() ===
        String(trip2.destination).trim().toLowerCase();

      const overlappingDates =
        new Date(trip1.startDate) <= new Date(trip2.endDate) &&
        new Date(trip1.endDate) >= new Date(trip2.startDate);

      if (sameDestination && overlappingDates) {
        return true;
      }
    }
  }

  return false;
}

// START CHAT
router.post("/start", authMiddleware, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user ID is required" });
    }

    if (String(otherUserId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    // ✅ DEMO FIX: Always allow chat
    const matched = true;

    if (!matched) {
      return res.status(403).json({
        message: "Chat is only allowed between matched travelers"
      });
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, otherUserId], $size: 2 }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.id, otherUserId]
      });
    }

    res.json({
      message: "Chat ready",
      chatId: chat._id
    });
  } catch (error) {
    console.error("Start chat error:", error);
    res.status(500).json({ message: "Server error while starting chat" });
  }
});

// GET ALL CHATS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
      .populate("participants", "name email isOnline lastSeen profileImage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error("Fetch chats error:", error);
    res.status(500).json({ message: "Server error while fetching chats" });
  }
});

// GET MESSAGES
router.get("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isParticipant = chat.participants.some(
      (id) => String(id) === String(req.user.id)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    const messages = await Message.find({ chat: chat._id })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).json({ message: "Server error while fetching messages" });
  }
});

// SEND MESSAGE
router.post("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isParticipant = chat.participants.some(
      (id) => String(id) === String(req.user.id)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    const message = await Message.create({
      chat: chat._id,
      sender: req.user.id,
      text: text.trim(),
      status: "sent"
    });

    chat.updatedAt = new Date();
    await chat.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name"
    );

    const receiverId = chat.participants.find(
      (id) => String(id) !== String(req.user.id)
    );

    if (receiverId) {
      await Notification.create({
        user: receiverId,
        type: "message",
        text: "You received a new message."
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error while sending message" });
  }
});

// MARK AS READ
router.put("/:chatId/read", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isParticipant = chat.participants.some(
      (id) => String(id) === String(req.user.id)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: req.user.id },
        status: "sent"
      },
      { status: "read" }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark messages read error:", error);
    res.status(500).json({ message: "Server error while marking messages as read" });
  }
});

module.exports = router;
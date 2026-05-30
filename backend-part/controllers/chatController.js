const Chat    = require("../models/Chat");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const path    = require("path");

const normaliseImg = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return src.startsWith("/uploads/") ? src : `/uploads/${src}`;
};

// @route  POST /api/chat
exports.getOrCreateChat = async (req, res) => {
  try {
    const { recipientId, productId } = req.body;
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId))
      return res.status(400).json({ success: false, message: "Valid recipient ID is required" });
    if (recipientId === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Cannot chat with yourself" });

    const chatQuery = { participants: { $all: [req.user._id, recipientId] } };
    if (productId && mongoose.Types.ObjectId.isValid(productId)) chatQuery.product = productId;

    let chat = await Chat.findOne(chatQuery)
      .populate("participants", "name avatar")
      .populate("product",      "title images price");

    if (!chat) {
      const chatData = { participants: [req.user._id, recipientId] };
      if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        chatData.product = productId;
        const product = await Product.findById(productId).lean();
        if (product) {
          chatData.productSnapshot = {
            title: product.title  || "",
            image: normaliseImg(product.images?.[0] || ""),
            price: product.price  || 0,
          };
        }
      }
      chat = await Chat.create(chatData);
      chat = await Chat.findById(chat._id)
        .populate("participants", "name avatar")
        .populate("product",      "title images price");
    }
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/chat/:chatId/messages
exports.sendMessage = async (req, res) => {
  try {
    const { content, messageType, offerPrice, replyTo, replySnap } = req.body;
    const imageFile = req.file;

    if (!content?.trim() && !imageFile)
      return res.status(400).json({ success: false, message: "Message or image is required" });
    if (!mongoose.Types.ObjectId.isValid(req.params.chatId))
      return res.status(400).json({ success: false, message: "Invalid chat ID" });

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: "Not a participant" });

    let type = "text";
    if (imageFile && content?.trim()) type = "mixed";
    else if (imageFile) type = "image";
    else if (messageType === "offer") type = "offer";

    const newMsg = {
      sender:      req.user._id,
      content:     content?.trim() || "",
      messageType: type,
      reactions:   [],
    };
    if (imageFile) newMsg.image = `/uploads/${imageFile.filename}`;
    if (type === "offer" && offerPrice) newMsg.offerPrice = Number(offerPrice);
    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      newMsg.replyTo   = replyTo;
      if (replySnap) newMsg.replySnap = { content: replySnap.content, sender: replySnap.sender };
    }

    chat.messages.push(newMsg);
    chat.lastMessage  = newMsg.image ? "📷 Image" : content?.trim() || "";
    chat.lastActivity = new Date();
    await chat.save();

    const saved = chat.messages[chat.messages.length - 1];
    // Populate sender on saved message
    await chat.populate("messages.sender", "name avatar");
    const populated = chat.messages.id(saved._id);

    res.json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/chat/:chatId/messages/:msgId/react
exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ success: false, message: "Emoji required" });

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: "Not a participant" });

    const msg = chat.messages.id(req.params.msgId);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    const existing = msg.reactions.find((r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji);
    if (existing) {
      // toggle off
      msg.reactions = msg.reactions.filter((r) => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji));
    } else {
      // remove any previous reaction from this user, then add new
      msg.reactions = msg.reactions.filter((r) => r.user.toString() !== req.user._id.toString());
      msg.reactions.push({ user: req.user._id, emoji });
    }
    await chat.save();
    res.json({ success: true, reactions: msg.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  DELETE /api/chat/:chatId/messages/:msgId
exports.deleteMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const msg = chat.messages.id(req.params.msgId);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    if (msg.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not your message" });

    msg.deleted = true;
    msg.content = "";
    msg.image   = "";
    await chat.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/chat
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name avatar")
      .populate("product",      "title images price")
      .sort({ lastActivity: -1 })
      .lean();

    const normalised = chats.map((c) => ({
      ...c,
      productSnapshot: c.productSnapshot
        ? { ...c.productSnapshot, image: normaliseImg(c.productSnapshot.image) }
        : null,
      unread: c.messages.filter((m) => !m.isRead && m.sender?.toString() !== req.user._id.toString()).length,
    }));
    res.json({ success: true, chats: normalised });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/chat/:chatId
exports.getChatMessages = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.chatId))
      return res.status(400).json({ success: false, message: "Invalid chat ID" });

    const chat = await Chat.findById(req.params.chatId)
      .populate("participants",    "name avatar")
      .populate("product",         "title images price")
      .populate("messages.sender", "name avatar")
      .lean();

    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const isParticipant = chat.participants.some((p) => p._id.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: "Not authorized" });

    await Chat.updateOne(
      { _id: chat._id },
      { $set: { "messages.$[elem].isRead": true } },
      { arrayFilters: [{ "elem.sender": { $ne: req.user._id }, "elem.isRead": false }] }
    );

    const result = {
      ...chat,
      productSnapshot: chat.productSnapshot
        ? { ...chat.productSnapshot, image: normaliseImg(chat.productSnapshot.image) }
        : null,
    };
    res.json({ success: true, chat: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  DELETE /api/chat/:chatId
// @desc   Delete an entire conversation (removes from both participants' view)
exports.deleteChat = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.chatId))
      return res.status(400).json({ success: false, message: "Invalid chat ID" });

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant)
      return res.status(403).json({ success: false, message: "Not authorized to delete this chat" });

    await chat.deleteOne();
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

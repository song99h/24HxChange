const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emoji: { type: String, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    sender:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content:     { type: String, default: "" },
    isRead:      { type: Boolean, default: false },
    messageType: { type: String, enum: ["text", "offer", "image", "mixed"], default: "text" },
    offerPrice:  { type: Number },
    image:       { type: String, default: "" },   // path for image messages
    reactions:   [reactionSchema],
    replyTo:     { type: mongoose.Schema.Types.ObjectId, default: null }, // reply-to message id
    replySnap:   { content: String, sender: String },                     // snapshot of replied msg
    deleted:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    product:      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productSnapshot: {
      title: { type: String, default: "" },
      image: { type: String, default: "" },
      price: { type: Number, default: 0  },
    },
    messages:     [messageSchema],
    lastMessage:  { type: String,  default: "" },
    lastActivity: { type: Date,    default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);

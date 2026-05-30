const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  vendor:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:    { type: String, required: true },
  image:    { type: String, default: "" },   // ✅ snapshot – e.g. /uploads/abc.jpg
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: {
      name:       String,
      phone:      String,
      street:     String,
      city:       String,
      country:    String,
      postalCode: String,
    },
    paymentMethod: { type: String, enum: ["cod", "card", "upi", "wallet"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    orderStatus:   { type: String, enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"], default: "placed" },
    totalAmount:   { type: Number, required: true },
    shippingFee:   { type: Number, default: 0 },
    discount:      { type: Number, default: 0 },
    finalAmount:   { type: Number, required: true },
    notes:         { type: String, default: "" },
    trackingNumber:{ type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

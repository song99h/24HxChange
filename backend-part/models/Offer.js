const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    buyer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    seller:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    offerPrice: { type: Number, required: true, min: 1 },
    message:    { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['pending', 'accepted', 'rejected', 'countered', 'completed'],
      default: 'pending',
    },
    counterPrice:   { type: Number },
    counterMessage: { type: String, default: '' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // set when order is placed
    // Product snapshot so offer still shows after product is edited/deleted
    productSnapshot: {
      title: { type: String },
      image: { type: String },
      price: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);

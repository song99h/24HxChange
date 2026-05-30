const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:    { type: String, required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    vendor:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },
    category:    { type: String, required: true },
    subcategory: { type: String, default: "" },
    images:      [{ type: String }],
    condition:   { type: String, enum: ["new", "like-new", "good", "fair", "poor"], default: "good" },
    stock:       { type: Number, default: 1, min: 0 },
    isNegotiable: { type: Boolean, default: false },
    location: {
      city:    { type: String, default: "" },
      country: { type: String, default: "" },
    },
    tags:     [{ type: String }],
    reviews:  [reviewSchema],
    rating:   { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    views:      { type: Number, default: 0 },
    sold:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Update rating on review change
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.rating = (total / this.reviews.length).toFixed(1);
    this.numReviews = this.reviews.length;
  }
};

// Text index for search
productSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);

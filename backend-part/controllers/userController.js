const User    = require("../models/User");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const path    = require("path");
const fs      = require("fs");

const normaliseImg = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return src.startsWith("/uploads/") ? src : `/uploads/${src}`;
};

// @route  PUT /api/users/profile
// @access Private
exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name)              updates.name  = req.body.name.trim();
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.dob)               updates.dob   = req.body.dob;
    if (req.body.address) {
      try { updates.address = JSON.parse(req.body.address); } catch (_) {}
    }

    // ✅ Avatar upload via profile form
    if (req.file) {
      // Delete old avatar file if it exists on disk
      const existing = await User.findById(req.user._id).select("avatar");
      if (existing?.avatar && existing.avatar.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", existing.avatar);
        if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
      }
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/users/profile-image
// @access Private
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No image uploaded" });

    // Delete old avatar
    const existing = await User.findById(req.user._id).select("avatar");
    if (existing?.avatar && existing.avatar.startsWith("/uploads/")) {
      const oldPath = path.join(__dirname, "..", existing.avatar);
      if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
    }

    const avatar = `/uploads/${req.file.filename}`;
    const user   = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    res.json({ success: true, user, avatar });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/users/wishlist/:productId
// @access Private
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    const user  = await User.findById(req.user._id);
    const index = user.wishlist.findIndex((id) => id.toString() === productId);

    if (index === -1) user.wishlist.push(productId);
    else              user.wishlist.splice(index, 1);
    await user.save();

    res.json({ success: true, wishlist: user.wishlist, message: index === -1 ? "Added to wishlist" : "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/users/wishlist
// @access Private
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path:  "wishlist",
      match: { isActive: true },
      populate: { path: "vendor", select: "name avatar" },
    });
    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/users/vendor/:id
// @access Public
exports.getVendorProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: "Invalid vendor ID" });

    const vendor = await User.findById(req.params.id).select("name avatar createdAt address role");
    if (!vendor || (vendor.role !== "vendor" && vendor.role !== "admin"))
      return res.status(404).json({ success: false, message: "Vendor not found" });

    const products = await Product.find({ vendor: vendor._id, isActive: true, isApproved: true })
      .select("title price images rating numReviews")
      .limit(12);

    res.json({ success: true, vendor, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Product = require("../models/Product");
const Order   = require("../models/Order");
const User    = require("../models/User");

const normaliseImages = (images = []) =>
  images.map((img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("/uploads/")) return img;
    return `/uploads/${img}`;
  }).filter(Boolean);

exports.applyVendor = async (req, res) => {
  try {
    if (req.user.role === "vendor") {
      return res.status(400).json({ success: false, message: "You are already a vendor" });
    }
    if (req.user.role === "admin") {
      return res.status(400).json({ success: false, message: "Admins cannot apply as vendor" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { role: "vendor" }, { new: true });
    res.json({ success: true, message: "Congratulations! You are now a vendor. Start listing products!", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, products: products.map((p) => ({ ...p, images: normaliseImages(p.images) })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVendorStats = async (req, res) => {
  try {
    const products     = await Product.find({ vendor: req.user._id, isActive: true }).lean();
    const totalProducts = products.length;
    const totalViews   = products.reduce((s, p) => s + (p.views || 0), 0);
    const totalSold    = products.reduce((s, p) => s + (p.sold  || 0), 0);
    const pendingApproval = products.filter((p) => !p.isApproved).length;

    const orders    = await Order.find({ "items.vendor": req.user._id });
    const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => {
      const mine = o.items.filter((i) => i.vendor?.toString() === req.user._id.toString());
      return sum + mine.reduce((s, i) => s + i.price * i.quantity, 0);
    }, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlySales = await Order.aggregate([
      { $match: { "items.vendor": req.user._id, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $month: "$createdAt" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: { totalProducts, totalViews, totalSold, totalRevenue, pendingApproval, totalOrders: orders.length },
      monthlySales,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

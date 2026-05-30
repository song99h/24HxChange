const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalVendors, totalProducts, totalOrders, pendingProducts] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "vendor" }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Product.countDocuments({ isApproved: false, isActive: true }),
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $month: "$createdAt" }, orders: { $sum: 1 }, revenue: { $sum: "$finalAmount" } } },
      { $sort: { _id: 1 } },
    ]);

    const recentOrders = await Order.find()
      .populate("buyer", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, stats: { totalUsers, totalVendors, totalProducts, totalOrders, pendingProducts, totalRevenue }, monthlyOrders, recentOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];

    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ success: false, message: "Cannot block admin" });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot block yourself" });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveProduct = async (req, res) => {
  try {
    const { approved } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { isApproved: !!approved }, { new: true }).populate("vendor", "name email");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: `Product ${approved ? "approved" : "rejected"}`, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    product.isFeatured = !product.isFeatured;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ isApproved: false, isActive: true })
      .populate("vendor", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "vendor", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role" });
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot change your own role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { orderStatus: status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("buyer", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, orders, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

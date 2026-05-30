const Order   = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Helper – normalise image path to /uploads/xxx
const normaliseImg = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/uploads/")) return src;
  return `/uploads/${src}`;
};

// @route  POST /api/orders
// @access Private
exports.placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: "No items in order" });
    if (!shippingAddress?.name)
      return res.status(400).json({ success: false, message: "Shipping name is required" });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product))
        return res.status(400).json({ success: false, message: "Invalid product ID" });

      const product = await Product.findById(item.product).populate("vendor", "_id");
      if (!product || !product.isActive)
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock for "${product.title}"` });

      totalAmount += product.price * item.quantity;

      // ✅ Save image snapshot from product at time of order
      const imageSnap = normaliseImg(product.images?.[0] || "");

      orderItems.push({
        product:  product._id,
        vendor:   product.vendor._id,
        title:    product.title,
        image:    imageSnap,          // ✅ snapshot stored on order
        price:    product.price,
        quantity: item.quantity,
      });
    }

    const shippingFee  = totalAmount > 1000 ? 0 : 50;
    const finalAmount  = totalAmount + shippingFee;

    const order = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      totalAmount,
      shippingFee,
      finalAmount,
      notes: notes || "",
    });

    // Decrease stock atomically
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    // Return populated order
    const populated = await Order.findById(order._id).populate("buyer", "name email avatar");
    res.status(201).json({ success: true, order: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/orders/my
// @access Private
exports.getMyOrders = async (req, res) => {
  try {
    // We DON'T populate items.product image here because we already have
    // the snapshot in item.image.  We still populate for title fallback.
    const orders = await Order.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Normalise every item.image in response
    const normalised = orders.map((o) => ({
      ...o,
      items: o.items.map((i) => ({ ...i, image: normaliseImg(i.image) })),
    }));

    res.json({ success: true, orders: normalised });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/orders/vendor
// @access Private (vendor/admin)
exports.getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ "items.vendor": req.user._id })
      .populate("buyer", "name email phone avatar")
      .sort({ createdAt: -1 })
      .lean();

    const normalised = orders.map((o) => ({
      ...o,
      items: o.items.map((i) => ({ ...i, image: normaliseImg(i.image) })),
    }));

    res.json({ success: true, orders: normalised });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/orders/:id/status
// @access Private (vendor/admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["placed", "confirmed", "shipped", "delivered", "cancelled"];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.orderStatus  = status;
    if (status === "delivered") order.paymentStatus = "paid";
    if (status === "cancelled") order.paymentStatus = "failed";
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/orders/:id
// @access Private
exports.getOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: "Invalid order ID" });

    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email phone avatar")
      .lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isOwner  = order.buyer._id.toString() === req.user._id.toString();
    const isVendor = order.items.some((i) => i.vendor?.toString() === req.user._id.toString());
    if (!isOwner && !isVendor && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Normalise images
    order.items = order.items.map((i) => ({ ...i, image: normaliseImg(i.image) }));

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

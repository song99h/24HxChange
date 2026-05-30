const Offer   = require('../models/Offer');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const normaliseImg = (src) => {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return src.startsWith('/uploads/') ? src : `/uploads/${src}`;
};

const populateOffer = (query) =>
  query
    .populate('buyer',   'name avatar email phone')
    .populate('seller',  'name avatar email')
    .populate('product', 'title images price stock isActive');

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Buyer creates / updates an offer
// @route  POST /api/offers
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.createOffer = async (req, res) => {
  try {
    const { productId, offerPrice, message } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: 'Valid product ID required' });
    if (!offerPrice || Number(offerPrice) <= 0)
      return res.status(400).json({ success: false, message: 'Offer price must be greater than 0' });

    const product = await Product.findById(productId).populate('vendor', '_id name');
    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product not found or no longer available' });
    if (product.vendor._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own product' });

    // If buyer already has a pending offer for this product, update it
    const existing = await Offer.findOne({ product: productId, buyer: req.user._id, status: 'pending' });
    if (existing) {
      existing.offerPrice = Number(offerPrice);
      existing.message    = message?.trim() || '';
      await existing.save();
      const pop = await populateOffer(Offer.findById(existing._id)).lean();
      return res.json({ success: true, offer: normaliseOffer(pop), updated: true });
    }

    const offer = await Offer.create({
      product:    productId,
      buyer:      req.user._id,
      seller:     product.vendor._id,
      offerPrice: Number(offerPrice),
      message:    message?.trim() || '',
      productSnapshot: {
        title: product.title,
        image: normaliseImg(product.images?.[0] || ''),
        price: product.price,
      },
    });

    const populated = await populateOffer(Offer.findById(offer._id)).lean();
    res.status(201).json({ success: true, offer: normaliseOffer(populated) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Seller views all incoming offers
// @route  GET /api/offers/seller
// @access Private (vendor / admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSellerOffers = async (req, res) => {
  try {
    const offers = await populateOffer(Offer.find({ seller: req.user._id }))
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, offers: offers.map(normaliseOffer) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Buyer views all offers they sent
// @route  GET /api/offers/buyer
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getBuyerOffers = async (req, res) => {
  try {
    const offers = await populateOffer(Offer.find({ buyer: req.user._id }))
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, offers: offers.map(normaliseOffer) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Seller accepts / rejects / counters an offer
// @route  PUT /api/offers/:id
// @access Private (seller)
// ─────────────────────────────────────────────────────────────────────────────
exports.respondToOffer = async (req, res) => {
  try {
    const { action, counterPrice, counterMessage } = req.body;
    const valid = ['accepted', 'rejected', 'countered'];
    if (!valid.includes(action))
      return res.status(400).json({ success: false, message: `action must be one of: ${valid.join(', ')}` });

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid offer ID' });

    const offer = await Offer.findById(req.params.id);
    if (!offer)
      return res.status(404).json({ success: false, message: 'Offer not found' });
    if (offer.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorised to respond to this offer' });
    if (offer.status !== 'pending')
      return res.status(400).json({ success: false, message: `Offer is already ${offer.status}` });

    offer.status = action;

    if (action === 'countered') {
      if (!counterPrice || Number(counterPrice) <= 0)
        return res.status(400).json({ success: false, message: 'Counter price is required and must be > 0' });
      offer.counterPrice   = Number(counterPrice);
      offer.counterMessage = counterMessage?.trim() || '';
    }

    await offer.save();

    const populated = await populateOffer(Offer.findById(offer._id)).lean();
    res.json({ success: true, offer: normaliseOffer(populated) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Buyer places an order from an accepted offer
// @route  POST /api/offers/:id/order
// @access Private (buyer)
// ─────────────────────────────────────────────────────────────────────────────
exports.createOrderFromOffer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid offer ID' });

    const offer = await Offer.findById(req.params.id).populate('product');
    if (!offer)
      return res.status(404).json({ success: false, message: 'Offer not found' });
    if (offer.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your offer' });
    if (offer.status !== 'accepted')
      return res.status(400).json({ success: false, message: 'Only accepted offers can be ordered' });

    const { shippingAddress, paymentMethod } = req.body;
    if (!shippingAddress?.name || !shippingAddress?.city)
      return res.status(400).json({ success: false, message: 'Shipping address (name & city) is required' });

    const product = offer.product;
    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product is no longer available' });
    if (product.stock < 1)
      return res.status(400).json({ success: false, message: 'Product is out of stock' });

    const itemPrice   = offer.offerPrice;        // use negotiated price
    const shippingFee = itemPrice > 1000 ? 0 : 50;
    const finalAmount = itemPrice + shippingFee;

    // Create order
    const order = await Order.create({
      buyer:    req.user._id,
      items: [{
        product:  product._id,
        vendor:   offer.seller,
        title:    product.title,
        image:    normaliseImg(product.images?.[0] || ''),
        price:    itemPrice,
        quantity: 1,
      }],
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      totalAmount:   itemPrice,
      shippingFee,
      finalAmount,
      notes: `Order placed from accepted offer. Original offer: ₹${offer.offerPrice}`,
    });

    // Mark offer completed + link order
    offer.status  = 'completed';
    offer.orderId = order._id;
    await offer.save();

    // Decrease stock
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -1, sold: 1 } });

    // Return populated order
    const fullOrder = await Order.findById(order._id).populate('buyer', 'name email');
    res.status(201).json({ success: true, order: fullOrder, offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Buyer withdraws a pending offer
// @route  DELETE /api/offers/:id
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer)
      return res.status(404).json({ success: false, message: 'Offer not found' });
    if (offer.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your offer' });
    if (offer.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Only pending offers can be withdrawn' });
    await offer.deleteOne();
    res.json({ success: true, message: 'Offer withdrawn successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── helper ────────────────────────────────────────────────────────────────────
const normaliseOffer = (o) => ({
  ...o,
  productSnapshot: o.productSnapshot
    ? { ...o.productSnapshot, image: normaliseImg(o.productSnapshot.image) }
    : null,
});

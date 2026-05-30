const Product  = require('../models/Product');
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');

// ─── helpers ─────────────────────────────────────────────────────────────────
const normaliseImg = (src) => {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return src.startsWith('/uploads/') ? src : `/uploads/${src}`;
};
const normaliseImages = (imgs = []) => imgs.map(normaliseImg).filter(Boolean);

// GET /api/products/featured  (must be before /:id route)
exports.getFeatured = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true, isApproved: true })
      .populate('vendor', 'name avatar')
      .limit(8).sort({ createdAt: -1 }).lean();
    res.json({ success: true, products: products.map(p => ({ ...p, images: normaliseImages(p.images) })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { search, category, condition, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const query = { isActive: true, isApproved: true };

    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category:    { $regex: search, $options: 'i' } },
        { tags:        { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }
    if (category)  query.category  = category;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc')  sortOption = { price:  1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'rating')     sortOption = { rating: -1 };
    if (sort === 'popular')    sortOption = { views:  -1 };

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('vendor', 'name avatar email phone')
        .sort(sortOption).skip(skip).limit(limitNum).lean(),
    ]);

    res.json({
      success: true,
      count: products.length, total,
      pages: Math.ceil(total / limitNum), currentPage: pageNum,
      products: products.map(p => ({ ...p, images: normaliseImages(p.images) })),
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product ID' });

    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name avatar email phone createdAt address')
      .populate('reviews.user', 'name avatar')
      .lean();

    if (!product || !product.isActive)
      return res.status(404).json({ success: false, message: 'Product not found' });

    Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();
    res.json({ success: true, product: { ...product, images: normaliseImages(product.images) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/products  (vendor/admin)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, originalPrice, category, subcategory, condition, stock, isNegotiable } = req.body;

    if (!title || !description || !price || !category)
      return res.status(400).json({ success: false, message: 'Title, description, price and category are required' });

    let location = {}, tags = [];
    try { location = req.body.location ? JSON.parse(req.body.location) : {}; } catch (_) {}
    try { tags     = req.body.tags     ? JSON.parse(req.body.tags)     : []; } catch (_) {}

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const product = await Product.create({
      vendor:        req.user._id,
      title:         title.trim(),
      description:   description.trim(),
      price:         Number(price),
      originalPrice: Number(originalPrice) || 0,
      category,
      subcategory:   subcategory || '',
      condition:     condition   || 'good',
      stock:         Number(stock) || 1,
      isNegotiable:  isNegotiable === 'true' || isNegotiable === true,
      location, tags, images,
      isApproved: true,   // auto-approve
      isActive:   true,
    });

    const populated = await Product.findById(product._id).populate('vendor', 'name avatar email');
    res.status(201).json({ success: true, product: { ...populated.toObject(), images: normaliseImages(populated.images) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PUT /api/products/:id  (owner/admin) — handles existingImages from EditProduct
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product ID' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorised to edit this product' });

    const allowed = ['title','description','price','originalPrice','category','subcategory','condition','stock','isNegotiable'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.title)                       updates.title         = updates.title.toString().trim();
    if (updates.description)                 updates.description   = updates.description.toString().trim();
    if (updates.price !== undefined)         updates.price         = Number(updates.price);
    if (updates.originalPrice !== undefined) updates.originalPrice = Number(updates.originalPrice) || 0;
    if (updates.stock !== undefined)         updates.stock         = Number(updates.stock) || 0;
    if (updates.isNegotiable !== undefined)  updates.isNegotiable  = updates.isNegotiable === 'true' || updates.isNegotiable === true;

    if (req.body.location) { try { updates.location = JSON.parse(req.body.location); } catch (_) {} }
    if (req.body.tags)     { try { updates.tags     = JSON.parse(req.body.tags);     } catch (_) {} }

    // Image management: keep existing + append new
    let images = product.images || [];
    if (req.body.existingImages) {
      try {
        const kept = JSON.parse(req.body.existingImages);
        // Delete removed files from disk
        images.forEach(img => {
          if (!kept.includes(img)) {
            const fp = path.join(__dirname, '..', img);
            if (fs.existsSync(fp)) { try { fs.unlinkSync(fp); } catch (_) {} }
          }
        });
        images = kept;
      } catch (_) {}
    }
    if (req.files && req.files.length > 0) {
      images = [...images, ...req.files.map(f => `/uploads/${f.filename}`)].slice(0, 5);
    }
    updates.images = images;

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('vendor', 'name avatar email');

    res.json({ success: true, product: { ...updated.toObject(), images: normaliseImages(updated.images) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product ID' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorised' });

    (product.images || []).forEach(img => {
      const fp = path.join(__dirname, '..', img);
      if (fs.existsSync(fp)) { try { fs.unlinkSync(fp); } catch (_) {} }
    });

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/products/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment)
      return res.status(400).json({ success: false, message: 'Rating and comment are required' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid product ID' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const already = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment: comment.trim() });
    product.updateRating();
    await product.save();

    res.status(201).json({ success: true, message: 'Review added', rating: product.rating, numReviews: product.numReviews });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Used by vendorController
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id, isActive: true }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, products: products.map(p => ({ ...p, images: normaliseImages(p.images) })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

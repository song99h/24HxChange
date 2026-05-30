const express = require("express");
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, addReview, getFeatured
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// IMPORTANT: /featured must come before /:id
router.get("/featured",         getFeatured);
router.get("/",                 getProducts);
router.post("/",                protect, authorize("vendor", "admin"), upload.array("images", 5), createProduct);
router.get("/:id",              getProduct);
router.put("/:id",              protect, upload.array("images", 5), updateProduct);
router.delete("/:id",           protect, deleteProduct);
router.post("/:id/reviews",     protect, addReview);

module.exports = router;

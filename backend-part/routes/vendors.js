const express = require("express");
const router = express.Router();
const { applyVendor, getMyProducts, getVendorStats } = require("../controllers/vendorController");
const { protect, authorize } = require("../middleware/auth");

router.post("/apply",    protect, applyVendor);
router.get("/products",  protect, authorize("vendor", "admin"), getMyProducts);
router.get("/stats",     protect, authorize("vendor", "admin"), getVendorStats);

module.exports = router;

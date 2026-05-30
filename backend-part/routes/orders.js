const express = require("express");
const router = express.Router();
const { placeOrder, getMyOrders, getVendorOrders, updateOrderStatus, getOrder } = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

router.post("/",          protect, placeOrder);
router.get("/my",         protect, getMyOrders);
router.get("/vendor",     protect, authorize("vendor", "admin"), getVendorOrders);
router.get("/:id",        protect, getOrder);
router.put("/:id/status", protect, authorize("vendor", "admin"), updateOrderStatus);

module.exports = router;

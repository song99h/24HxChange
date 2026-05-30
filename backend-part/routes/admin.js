const express = require("express");
const router = express.Router();
const {
  getDashboardStats, getAllUsers, toggleBlockUser, approveProduct,
  toggleFeatured, getPendingProducts, changeUserRole, getAllOrders, deleteProduct
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.get("/stats",                   getDashboardStats);
router.get("/users",                   getAllUsers);
router.patch("/users/:id/block",       toggleBlockUser);
router.patch("/users/:id/role",        changeUserRole);
router.get("/products/pending",        getPendingProducts);
router.patch("/products/:id/approve",  approveProduct);
router.patch("/products/:id/featured", toggleFeatured);
router.delete("/products/:id",         deleteProduct);
router.get("/orders",                  getAllOrders);

module.exports = router;

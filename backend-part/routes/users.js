const express = require("express");
const router  = express.Router();
const {
  updateProfile, updateProfileImage, toggleWishlist, getWishlist, getVendorProfile
} = require("../controllers/userController");
const { protect }  = require("../middleware/auth");
const upload       = require("../middleware/upload");

router.put("/profile",              protect, upload.single("avatar"),  updateProfile);
router.put("/profile-image",        protect, upload.single("image"),   updateProfileImage);  // ✅ dedicated
router.get("/wishlist",             protect, getWishlist);
router.post("/wishlist/:productId", protect, toggleWishlist);
router.get("/vendor/:id",           getVendorProfile);

module.exports = router;

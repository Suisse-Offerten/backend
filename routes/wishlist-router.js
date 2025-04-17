const express = require("express");
const router = express.Router();
const {
  getAllWishlist,
  getsingleWishlist,
  createWishlist,
  deleteWishlist,
  updateWishlistStatus,
} = require("../controller/wishlist-controller");
const auth = require("../middlewares/auth");

router.get("/", auth, getAllWishlist);
router.get("/one", auth, getsingleWishlist);
router.post("/", auth, createWishlist);
router.patch("/:id", auth, updateWishlistStatus);
router.delete("/:id", auth, deleteWishlist);

module.exports = router;

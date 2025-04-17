const express = require("express");
const router = express.Router();
const {
  getAllReview,
  getUserReview,
  getsingleReview,
  createReview,
  updateReview,
  updateReviewUseful,
  deleteReview,
  getAllReviewByAdmin,
  updateReviewStatus,
  getAllReviewsDefault,
  getAllReviewBySellerAdmin,
  getAllReviewByClientAdmin,
} = require("../controller/review-controller");
const auth = require("../middlewares/auth");

router.get("/", getAllReview);
router.get("/default", auth, getAllReviewsDefault);
router.get("/seller/admin", auth, getAllReviewBySellerAdmin);
router.get("/client/admin", auth, getAllReviewByClientAdmin);
router.get("/admin", auth, getAllReviewByAdmin);
router.get("/:id", auth, getUserReview);
router.get("/single/:id", auth, getsingleReview);
router.post("/", auth, createReview);
router.patch("/status", auth, updateReviewStatus);
router.patch("/:id", auth, updateReview);
router.patch("/like/:id", auth, updateReviewUseful);
router.delete("/:id", auth, deleteReview);

module.exports = router;

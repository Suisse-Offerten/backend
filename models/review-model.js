const mongoose = require("mongoose");
const reviewSchema = mongoose.Schema(
  {
    clinetName: {
      type: String,
    },
    sellerName: {
      type: String,
    },
    review: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    jobId: {
      type: String,
    },
    jobTitle: {
      type: String,
    },
    sellerId: {
      type: String,
    },
    clientId: {
      type: String,
    },
    jobCategory: {
      type: String,
    },
    status: {
      type: String,
      default: "pending",
    },
    useful: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("review", reviewSchema);

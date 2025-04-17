const mongoose = require("mongoose");
const wishlistSchema = mongoose.Schema(
  {
    saverId: {
      type: String,
    },
    jobId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("wishlist", wishlistSchema);

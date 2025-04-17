const mongoose = require("mongoose");
const wishlistSchema = mongoose.Schema(
  {
    job: {
      type: Object,
    },
    saverId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("wishlist", wishlistSchema);

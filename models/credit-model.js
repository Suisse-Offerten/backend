const mongoose = require("mongoose");
const creditSchema = mongoose.Schema(
  {
    title: {
      type: String,
    },
    price: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("credit", creditSchema);

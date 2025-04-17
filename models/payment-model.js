const mongoose = require("mongoose");
const paymentSchema = mongoose.Schema(
  {
    userId: {
      type: String,
    },
    price: {
      type: Number,
    },
    credits: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("payment", paymentSchema);

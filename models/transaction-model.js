const mongoose = require("mongoose");
const transactionSchema = mongoose.Schema(
  {
    transactionId: {
      type: String,
    },
    sellerId: {
      type: String,
    },
    memberShip: {
      type: Object,
    },
    status: {
      type: String,
    },
    credits: {
      type: Object,
    },
    cost: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("transaction", transactionSchema);

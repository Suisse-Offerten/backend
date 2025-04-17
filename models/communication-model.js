const mongoose = require("mongoose");

const communicationSchema = mongoose.Schema(
  {
    clientId: {
      type: String,
    },
    jobId: {
      type: String,
    },
    sellerId: {
      type: String,
    },
    sellerMessage: {
      type: [Object],
      default: [],
    },
    clientMessage: {
      type: [Object],
      default: [],
    },
    status: {
      type: String,
      default: "progress",
    },
    view: {
      type: String,
    },
    offerRequest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("communication", communicationSchema);

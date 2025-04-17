const mongoose = require("mongoose");
const offerSchema = mongoose.Schema(
  {
    sellerId: {
      type: String,
    },
    clientId: {
      type: String,
    },
    jobId: {
      type: String,
    },
    offerPrice: {
      type: String,
    },
    priceUnit: {
      type: String,
    },
    offerNote: {
      type: String,
    },
    offerFiles: {
      type: String,
    },
    bidMessage: {
      type: String,
    },
    offerMessage: {
      type: String,
    },
    perticipationId: {
      type: String,
    },
    status: {
      type: String,
    },
    reviewRequest: {
      type: Boolean,
    },
    view: {
      type: String,
    },
    requestView: {
      type: String,
    },
    offerRequested: {
      type: Boolean,
      default: false,
    },
    offerRequestedNotify: {
      type: Boolean,
      default: false,
    },
    offerRejected: {
      type: Boolean,
      default: false,
    },
    offerPlaced: {
      type: Boolean,
      default: false,
    },
    offerPlacedNotify: {
      type: Boolean,
      default: false,
    },
    offerAccepted: {
      type: Boolean,
      default: false,
    },
    offerArchived: {
      type: Boolean,
      default: false,
    },
    reviewSubmited: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("offer", offerSchema);

const mongoose = require("mongoose");
const membershipSchema = mongoose.Schema(
  {
    title: {
      type: String,
    },
    savePrice: {
      type: Number,
      default: 0,
    },
    existPrice: {
      type: Number,
      default: 0,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    plan: {
      type: String,
    },
    shortNote: {
      type: String,
    },
    featureOne: {
      type: String,
    },
    featureTow: {
      type: String,
    },
    featureThree: {
      type: String,
    },
    featureFour: {
      type: String,
    },
    featureFive: {
      type: String,
    },
    status: {
      type: String,
    },
    activeDate: {
      type: String,
    },
    planTime: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("membership", membershipSchema);

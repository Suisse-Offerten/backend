const mongoose = require("mongoose");
const jobSchema = mongoose.Schema(
  {
    jobTitle: {
      type: String,
    },
    jobDescription: {
      type: String,
    },
    jobCategoryCode: {
      type: String,
    },
    jobCategoryId: {
      type: String,
    },
    jobSubCategories: {
      type: Array,
      default: [],
    },
    jobQuestions: {
      type: Object,
    },
    jobPostcode: {
      type: String,
    },
    jobLocation: {
      type: String,
    },
    jobSiteVisitPossible: {
      type: String,
    },
    jobCompletionDate: {
      type: String,
    },
    jobFiles: {
      type: Array,
    },
    status: {
      type: String,
      default: "pending",
    },
    jobEmail: {
      type: String,
    },
    clientEmail: {
      type: String,
    },
    requireCredit: {
      type: Number,
    },
    jobCity: {
      type: String,
    },
    jobNumber: {
      type: Number,
    },
    jobUsername: {
      type: String,
    },
    placeBid: {
      type: Number,
      default: 0,
    },
    acceptBid: {
      type: Number,
      default: 0,
    },
    rejectBid: {
      type: Number,
      default: 0,
    },
    offerRequest: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("job", jobSchema);

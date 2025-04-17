const mongoose = require("mongoose");
const newsSchema = mongoose.Schema(
  {
    nameOfStation: {
      type: String,
    },
    senderEmail: {
      type: String,
    },
    reference: {
      type: String,
    },
    news: {
      type: String,
    },
    sendName: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("news", newsSchema);

const mongoose = require("mongoose");
const verifySchema = mongoose.Schema(
  {
    email: {
      type: String,
    },
    code: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("verify", verifySchema);

const mongoose = require("mongoose");

const contactSchema = mongoose.Schema(
  {
    notice: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    service: {
      type: String,
    },
    role: {
      type: String,
    },
    status: {
      type: String,
      default: "unread",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("contact", contactSchema);

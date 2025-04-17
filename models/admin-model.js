const mongoose = require("mongoose");
const adminSchema = mongoose.Schema(
  {
    username: {
      type: String,
    },
    fullname: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
    },
    profile: {
      type: String,
    },
    agreement: {
      type: Boolean,
    },
    about: {
      type: String,
    },
    facebook: {
      type: String,
    },
    instagram: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    youtube: {
      type: String,
    },
    cover: {
      type: String,
    },
    followers: {
      type: String,
    },
    following: {
      type: String,
    },
    title: {
      type: String,
    },
    city: {
      type: String,
    },
    zip: {
      type: String,
    },
    country: {
      type: String,
    },
    businesId: {
      type: String,
    },
    computer: {
      type: String,
    },
    photoshop: {
      type: String,
    },
    microsoft: {
      type: String,
    },
    headline: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("admin", adminSchema);

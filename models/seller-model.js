const mongoose = require("mongoose");
const sellerSchema = mongoose.Schema(
  {
    salutation: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    director: {
      type: String,
    },
    dirfirstname: {
      type: String,
    },
    dirlastname: {
      type: String,
    },
    companyName: {
      type: String,
    },
    leagalForm: {
      type: String,
    },
    foundingYear: {
      type: Number,
    },
    website: {
      type: String,
    },
    UIDNumber: {
      type: String,
    },
    iban: {
      type: String,
    },
    streetNo: {
      type: String,
    },
    postalCode: {
      type: Number,
    },
    location: {
      type: String,
    },
    phone: {
      type: String,
    },
    secondPhone: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    furtherInfo: {
      type: String,
    },
    referance: {
      type: String,
    },
    agreement: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "pending",
    },
    person: {
      type: String,
    },
    reviewRating: {
      type: Number,
      default: 0,
    },
    totalReview: {
      type: Number,
      default: 0,
    },
    reviewPercent: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      default: 0,
    },
    activities: {
      type: Array,
      default: [],
    },
    preference: {
      type: Array,
      default: [],
    },
    categories: {
      type: Array,
      default: [],
    },
    categoryCode: {
      type: Array,
      default: [],
    },
    companyDescription: {
      type: String,
    },
    companyTitle: {
      type: String,
    },
    companyInfo: {
      type: Array,
    },
    companyLogo: {
      type: String,
    },
    companyCover: {
      type: String,
    },
    companyPictures: {
      type: Array,
    },
    emailVerify: {
      type: Boolean,
      default: false,
    },
    uidVerify: {
      type: Boolean,
      default: false,
    },
    locationVerify: {
      type: Boolean,
      default: false,
    },
    memberShip: {
      type: Object,
    },
    memberShipStatus: {
      type: String,
    },
    pendingCredits: {
      type: Number,
      default: 0,
    },
    addressFile: {
      type: String,
    },
    newsletter: {
      type: Boolean,
    },
    membershipActive: {
      type: String,
    },
    extendCredit: {
      type: Number,
    },
    extendTime: {
      type: Number,
    },
    extendMembership: {
      type: Object,
    },
    freeTire: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("seller", sellerSchema);

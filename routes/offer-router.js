const express = require("express");
const router = express.Router();
const {
  getAllOffer,
  createOffer,
  getOneOffer,
  getAllOfferDefault,
  createPerticipation,
  makeOfferRequest,
  sendBidRequest,
  updateOfferRequest,
  getOneOfferByJobId,
  updateOfferView,
  getOneOfferByBoth,
  getAllOfferByClient,
  getAllOfferBySeller,
  updateOfferDetails,
  offerReviewRequest,
  offerArchiveRequest,
  getAllOfferBySellerBoth,
  getAllOfferByAdmin,
  deleteOffer,
} = require("../controller/offer-controller");
const auth = require("../middlewares/auth");
const offerFiles = require("../middlewares/offerFiles");

router.get("/admin", auth, getAllOfferByAdmin);
router.get("/default", auth, getAllOfferDefault);
router.get("/both", auth, getOneOfferByBoth);
router.get("/client", auth, getAllOfferByClient);
router.get("/seller", auth, getAllOfferBySeller);
router.get("/seller/both", auth, getAllOfferBySellerBoth);
router.get("/", auth, getAllOffer);
router.post("/create", auth, createPerticipation);
router.post("/", auth, createOffer);
router.get("/:id", auth, getOneOffer);
router.get("/job/:id", auth, getOneOfferByJobId);
router.patch("/bid/:id", auth, makeOfferRequest);
router.patch("/review/request/:id", auth, offerReviewRequest);
router.patch("/archive/request/:id", auth, offerArchiveRequest);
router.patch("/details/:id", auth, offerFiles, updateOfferDetails);
router.patch("/view", auth, updateOfferView);
router.patch("/send/proposal", auth, offerFiles, sendBidRequest);
router.patch("/status/:id", auth, updateOfferRequest);
router.delete("/:id", auth, deleteOffer);

module.exports = router;

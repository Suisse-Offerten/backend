const express = require("express");
const router = express.Router();
const {
  getAllSeller,
  getOneSeller,
  register,
  login,
  otpSend,
  otpCheck,
  changePassword,
  updateSeller,
  updateSellerStatus,
  deleteSeller,
  updateSellerActivity,
  updateSellerCompany,
  sellerEmailVarification,
  getAllSellersByAdmin,
  updateSellerStatusByAdmin,
  createSellerByAdmin,
  deleteSellerCompanyPictures,
  uploadSellerAddress,
  changePasswordBySeller,
  updateSellerByAdmin,
  sendResetPasswordLink,
  updateSellerCredits,
  updateSellerActivityByAdmin,
  freeTirelMembership,
} = require("../controller/seller-controller");
const auth = require("../middlewares/auth");
const userFiles = require("../middlewares/companyImages");
const addressFile = require("../middlewares/addressFile");

router.post("/change", changePassword);
router.get("/access/admin", getAllSellersByAdmin);
router.get("/verify-email", sellerEmailVarification);
router.get("/", getAllSeller);
router.get("/:id", getOneSeller);
router.post("/admin", createSellerByAdmin);
router.post("/admin/send", sendResetPasswordLink);
router.post("/register", register);
router.post("/login", login);
router.post("/otp", otpSend);
router.post("/otp/check", otpCheck);
router.patch("/change/password/:id", auth, changePasswordBySeller);
router.patch("/freetirel/:id", auth, freeTirelMembership);
router.patch("/update/:id", auth, deleteSellerCompanyPictures);
router.patch("/upload/:id", auth, addressFile, uploadSellerAddress);
router.patch("/update/credits/:id", auth, addressFile, updateSellerCredits);
router.patch("/access/status", auth, updateSellerStatusByAdmin);
router.patch("/:id", auth, updateSeller);
router.patch("/activity/:id", auth, updateSellerActivity);
router.patch("/activity/admin/:id", auth, updateSellerActivityByAdmin);
router.patch("/status/:id", auth, updateSellerStatus);
router.patch("/update/admin/:id", auth, userFiles, updateSellerByAdmin);
router.patch("/company/:id", auth, userFiles, updateSellerCompany);
router.delete("/:id", auth, deleteSeller);

module.exports = router;

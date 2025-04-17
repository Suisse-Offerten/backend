const express = require("express");
const router = express.Router();
const {
  getAdmin,
  getOneAdmin,
  register,
  login,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  otpSend,
  otpCheck,
  changePassword,
} = require("../controller/admin-controller");
const auth = require("../middlewares/auth");
const adminImages = require("../middlewares/adminImages");

router.get("/", auth, getAdmin);
router.get("/:id", auth, getOneAdmin);
router.post("/change", changePassword);
router.post("/register", register);
router.post("/login", login);
router.post("/otp", otpSend);
router.post("/otp/check", otpCheck);
router.patch("/:id", auth, adminImages, updateAdmin);
router.patch("/password/:id", auth, updateAdminPassword);
router.delete("/:id", auth, deleteAdmin);

module.exports = router;

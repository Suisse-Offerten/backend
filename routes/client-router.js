const express = require("express");
const router = express.Router();
const {
  getClient,
  getClientById,
  getClientByEmail,
  register,
  login,
  otpSend,
  otpCheck,
  changePassword,
  updateClient,
  updateClientStatus,
  deleteClient,
  VerifyCodeCheck,
  getAllClientsByAdmin,
  updateClientStatusByAdmin,
  createClientByAdmin,
  changePasswordByClient,
  sendResetPasswordLink,
} = require("../controller/client-controller");
const auth = require("../middlewares/auth");

router.get("/", auth, getClient);
router.get("/:id", auth, getClientById);
router.get("/access/email", auth, getClientByEmail);
router.get("/access/admin", auth, getAllClientsByAdmin);
router.post("/register", register);
router.post("/admin", createClientByAdmin);
router.post("/verify/check", VerifyCodeCheck);
router.post("/login", login);
router.post("/otp", otpSend);
router.post("/otp/check", otpCheck);
router.post("/admin/send", sendResetPasswordLink);
router.post("/change", changePassword);
router.patch("/change/password/:id", changePasswordByClient);
router.patch("/access/admin", auth, updateClientStatusByAdmin);
router.patch("/:id", auth, updateClient);
router.patch("/status/:id", auth, updateClientStatus);
router.delete("/:id", auth, deleteClient);

module.exports = router;

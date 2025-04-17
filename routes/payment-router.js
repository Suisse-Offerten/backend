const express = require("express");
const router = express.Router();
const {
  createMembershipPayment,
  getAllPayment,
  getSinglePayment,
  deletePayment,
  createCreditsPayment,
  getAllTransactions,
} = require("../controller/payment-controller");
const auth = require("../middlewares/auth");

router.get("/transaction", auth, getAllTransactions);
router.get("/", auth, getAllPayment);
router.get("/:id", auth, getSinglePayment);
router.post("/credit", createCreditsPayment);
router.post("/:id", createMembershipPayment);
router.post("/:id", deletePayment);

module.exports = router;

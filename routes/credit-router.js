const express = require("express");
const router = express.Router();
const {
  getOneCredit,
  getAllCredit,
  createCredit,
  updateCredit,
  deleteCredit,
  cancelCredit,
  getAllCreditByAdmin,
} = require("../controller/credit-controller");
const auth = require("../middlewares/auth");

router.get("/", auth, getAllCreditByAdmin);
router.get("/seller", auth, getAllCredit);
router.get("/:id", auth, getOneCredit);
router.post("/", auth, createCredit);
router.patch("/cancel/:id", auth, cancelCredit);
router.patch("/:id", auth, updateCredit);
router.delete("/:id", auth, deleteCredit);

module.exports = router;

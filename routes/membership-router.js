const express = require("express");
const router = express.Router();
const {
  getOneMembership,
  getAllMembership,
  createMembership,
  updateMembership,
  deleteMembership,
  cancelMembership,
  getAllMembershipByAdmin,
} = require("../controller/membership-controller");
const auth = require("../middlewares/auth");

router.get("/admin", auth, getAllMembershipByAdmin);
router.get("/", getAllMembership);
router.get("/:id", auth, getOneMembership);
router.post("/", auth, createMembership);
router.patch("/cancel/:id", auth, cancelMembership);
router.patch("/:id", auth, updateMembership);
router.delete("/:id", auth, deleteMembership);

module.exports = router;

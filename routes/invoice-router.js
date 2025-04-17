const express = require("express");
const auth = require("../middlewares/auth");
const {
  getAllInvoice,
  downloadInvoice,
} = require("../controller/invoice-controller");
const router = express.Router();

router.get("/", auth, getAllInvoice);
router.get("/:id", auth, downloadInvoice);

module.exports = router;

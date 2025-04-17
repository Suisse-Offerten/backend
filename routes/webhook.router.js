const express = require("express");
const {
  membershipWebhook,
  creditWebhook,
} = require("../controller/webhook.controller");
const router = express.Router();

router.post(
  "/membership",
  express.raw({ type: "application/json" }),
  membershipWebhook
);
router.post(
  "/credits",
  express.raw({ type: "application/json" }),
  creditWebhook
);

module.exports = router;

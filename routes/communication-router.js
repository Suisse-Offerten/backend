const express = require("express");
const router = express.Router();
const {
  getAllCommunication,
  getUserCommunication,
  getsingleCommunication,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  getAllCommunicationByClient,
  updateCommunicationView,
} = require("../controller/communication-controller");
const auth = require("../middlewares/auth");

router.get("/default", auth, getAllCommunicationByClient);
router.get("/", auth, getAllCommunication);
router.get("/:id", auth, getUserCommunication);
router.get("/single/:id", auth, getsingleCommunication);
router.post("/", auth, createCommunication);
router.patch("/view", auth, updateCommunicationView);
router.patch("/:id", auth, updateCommunication);
router.delete("/:id", auth, deleteCommunication);

module.exports = router;

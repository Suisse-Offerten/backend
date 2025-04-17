const express = require("express");
const router = express.Router();
const {
  getAllNews,
  getsingleNews,
  createNews,
  updateNews,
  deleteNews,
  getAllNewsByAdmin,
} = require("../controller/news-controller");
const auth = require("../middlewares/auth");

router.get("/admin", auth, getAllNewsByAdmin);
router.get("/", auth, getAllNews);
router.get("/:id", auth, getsingleNews);
router.post("/", auth, createNews);
router.patch("/:id", auth, updateNews);
router.delete("/:id", auth, deleteNews);

module.exports = router;

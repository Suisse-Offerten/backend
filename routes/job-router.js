const express = require("express");
const router = express.Router();
const {
  getAllJob,
  getOneJob,
  createJob,
  updateJob,
  deleteJob,
  CheckClient,
  filterJob,
  getJobsByCategory,
  getAllJobByClient,
  getAllJobBySeller,
  getAllJobByAdmin,
  updateJobStatus,
  getAllJobDefault,
} = require("../controller/job-controller");
const auth = require("../middlewares/auth");
const jobFiles = require("../middlewares/jobFiles");

router.get("/filter", auth, filterJob);
router.get("/check", auth, CheckClient);
router.get("/admin", getAllJobByAdmin);
router.get("/default", getAllJobDefault);
router.get("/", getAllJob);
router.get("/client", getAllJobByClient);
router.get("/category", getJobsByCategory);
router.get("/seller", getAllJobBySeller);
router.get("/:id", getOneJob);
router.post("/", jobFiles, createJob);
router.patch("/:id", auth, updateJobStatus);
router.patch("/:id", jobFiles, auth, updateJob);
router.delete("/:id", auth, deleteJob);

module.exports = router;

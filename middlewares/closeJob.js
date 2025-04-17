const JobModel = require("../models/job-model");

async function closeJob() {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  try {
    await JobModel.updateMany(
      {
        createdAt: { $lte: tenDaysAgo },
        $or: [{ status: "active" }, { status: "pending" }],
      },
      { $set: { status: "close" } }
    );
  } catch (error) {
    console.error(error);
  }
}

module.exports = closeJob;

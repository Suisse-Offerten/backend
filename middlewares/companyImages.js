const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "companyCover", maxCount: 1 },
  { name: "companyPictures", maxCount: 10 },
]);

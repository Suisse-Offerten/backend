const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "companyCover", maxCount: 1 },
  { name: "companyPictures", maxCount: 10 },
]);

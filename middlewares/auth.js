require("dotenv").config();
const jwt = require("jsonwebtoken");
const { UNAUTHORIZE_USER_MESSAGE } = require("../utils/response");
const secretkey = process.env.SECRET_KEY;

const auth = (req, res, next) => {
  try {
    let token = req.headers.token;
    if (token) {
      token = token.split(" ")[1];
      let user = jwt.verify(token, secretkey);
      req.userId = user.id;
    } else {
      return res.status(400).json({ message: UNAUTHORIZE_USER_MESSAGE });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: UNAUTHORIZE_USER_MESSAGE });
  }
};

module.exports = auth;

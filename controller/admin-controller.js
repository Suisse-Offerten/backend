require("dotenv").config();
const AdminModel = require("../models/admin-model");
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.SECRET_KEY;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;
const jwt = require("jsonwebtoken");
const OTPModel = require("../models/otp-model");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  EMAIL_ALREADY_EXIST_MESSAGE,
  REGISTRATION_SUCCESS_MESSAGE,
  INCORRECT_PASSWORD_MESSAGE,
  LOGIN_SUCCESSFUL_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  OTP_SEND_SUCCESS_MESSAGE,
  TOKEN_EXPIRED_MESSAGE,
  OTP_MATCH_SUCCESS_MESSAGE,
  OTP_NOT_MATCH_MESSAGE,
  PASSWORD_CHANGE_SUCCESS_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  RESET_PASSWORD_RESPONSE,
  GET_OTP_RESPONSE,
  YOUR_OTP_RESPONSE,
  SINGNATURE_RESPONSE,
  OUTRO_RESPONSE,
} = require("../utils/email.response");
const supportMail = process.env.SUPPORT_MAIL;
const corsUrl = process.env.CORS_URL;

// Get All Admin
async function getAdmin(req, res) {
  try {
    const data = await AdminModel.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get Single Admin
async function getOneAdmin(req, res) {
  const id = req.params.id;
  const existAdmin = await AdminModel.findOne({ _id: id });
  try {
    if (!existAdmin) {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    } else {
      res.status(200).json(existAdmin);
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Register Admin
async function register(req, res) {
  const { username, email, password, agreement } = req.body;
  const existAdmin = await AdminModel.findOne({ email: email });
  try {
    if (existAdmin) {
      return res.status(404).json({ message: EMAIL_ALREADY_EXIST_MESSAGE });
    }
    bcrypt.hash(password, 10, async function (err, hash) {
      const newAdmin = new AdminModel({
        username,
        email,
        password: hash,
        agreement,
      });
      const token = jwt.sign(
        { email: newAdmin.email, id: newAdmin._id },
        SECRET_KEY
      );
      await newAdmin.save();
      res.status(201).json({
        admin: newAdmin,
        token: "Bearer " + token,
        message: REGISTRATION_SUCCESS_MESSAGE,
      });
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Login Admin
async function login(req, res) {
  const { email, password } = req.body;
  try {
    const existAdmin = await AdminModel.findOne({ email: email });
    if (!existAdmin) {
      return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
    const matchpassword = await bcrypt.compare(password, existAdmin.password);
    if (!matchpassword) {
      return res.status(400).json({ message: INCORRECT_PASSWORD_MESSAGE });
    }
    const token = jwt.sign(
      { email: existAdmin.email, id: existAdmin._id },
      SECRET_KEY
    );
    res.status(200).json({
      admin: existAdmin,
      token: token,
      message: LOGIN_SUCCESSFUL_MESSAGE,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update admin
async function updateAdmin(req, res) {
  const {
    username,
    fullname,
    email,
    phone,
    followers,
    about,
    facebook,
    instagram,
    linkedin,
    youtube,
    following,
    title,
    city,
    zip,
    country,
    businesId,
    computer,
    photoshop,
    microsoft,
    headline,
  } = req.body;
  const id = req.params.id;
  const existAdmin = await AdminModel.findOne({ _id: id });
  const profile = req?.files?.profile[0]?.originalname.split(" ").join("-");
  const cover = req?.files.cover[0]?.originalname?.split(" ")?.join("-");
  const basePath = `${req.protocol}://${req.get("host")}/uploads/`;
  try {
    if (existAdmin) {
      const UpdateAdmin = {
        username,
        fullname,
        email,
        phone,
        followers,
        about,
        facebook,
        instagram,
        linkedin,
        youtube,
        following,
        title,
        city,
        zip,
        country,
        businesId,
        computer,
        photoshop,
        microsoft,
        headline,
        profile: `${basePath ? `${basePath}${profile}` : "null"}`,
        cover: `${basePath ? `${basePath}${cover}` : "null"}`,
      };
      await AdminModel.findByIdAndUpdate(id, UpdateAdmin, {
        new: true,
      });
      res
        .status(200)
        .json({ admin: UpdateAdmin, message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// OTP Send
async function otpSend(req, res) {
  const { email } = req.body;
  try {
    const existAdmin = await AdminModel.findOne({ email: email });
    if (existAdmin) {
      let otp = Math.floor(Math.random() * 10000 + 1);
      let otpData = new OTPModel({
        email,
        code: otp,
        expireIn: new Date().getTime() + 300 * 1000,
      });
      await otpData.save();

      let config = {
        host: SMTP,
        port: PORT,
        secure: false,
        auth: {
          user: EMAIL,
          pass: PASSWORD,
        },
      };
      let transport = nodemailer.createTransport(config);
      let mailGenarator = new Mailgen({
        theme: "default",
        product: {
          name: NAME_RESPONSE,
          link: DOMAIN_URL_RESPONSE,
          copyright: OUTRO_RESPONSE,
        },
      });
      let response = {
        body: {
          name: existAdmin?.email,
          intro: RESET_PASSWORD_RESPONSE,
          signature: SINGNATURE_RESPONSE,
          table: {
            data: [
              {
                Message: `${YOUR_OTP_RESPONSE} ${otp}`,
              },
            ],
          },
          outro: `
        <p style="font-size: 14px; color: #777;">${GET_OTP_RESPONSE}</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
      `,
        },
      };
      let mail = await mailGenarator.generate(response);
      let message = {
        from: EMAIL,
        to: req.body.email,
        subject: RESET_PASSWORD_RESPONSE,
        html: mail,
      };
      transport.sendMail(message).then(() => {
        return res
          .status(200)
          .json({ email: email, message: OTP_SEND_SUCCESS_MESSAGE });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// OTP Check
async function otpCheck(req, res) {
  try {
    const data = await OTPModel.findOne({ code: req.body.code });

    if (data) {
      let currentTime = new Date().getTime();
      let diffrenceTime = data.expireIn - currentTime;
      if (diffrenceTime < 0) {
        res.status(500).json({ message: TOKEN_EXPIRED_MESSAGE });
      } else {
        res.status(200).json({ message: OTP_MATCH_SUCCESS_MESSAGE });
      }
    } else {
      res.status(500).json({ message: OTP_NOT_MATCH_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Change Password
async function changePassword(req, res) {
  const { email, password } = req.body;
  try {
    let admin = await AdminModel.findOne({ email });
    if (admin) {
      bcrypt.hash(password, 10, async function (err, hash) {
        admin.password = hash;
        await admin.save();
        res.status(200).json({ message: PASSWORD_CHANGE_SUCCESS_MESSAGE });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// admin password update
async function updateAdminPassword(req, res) {
  const { password } = req.body;
  const id = req.params.id;
  const existAdmin = await AdminModel.findOne({ _id: id });
  try {
    if (existAdmin) {
      bcrypt.hash(password, 10, async function (err, hash) {
        const updateAdmin = {
          password: hash,
        };
        await AdminModel.findByIdAndUpdate(id, updateAdmin, {
          new: true,
        });
        res.status(200).json({ message: PASSWORD_CHANGE_SUCCESS_MESSAGE });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Delete admin
async function deleteAdmin(req, res) {
  const id = req.params.id;
  let existAdmin = await AdminModel.findOne({ _id: id });
  try {
    if (existAdmin) {
      await AdminModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

module.exports = {
  getAdmin,
  getOneAdmin,
  register,
  login,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  otpSend,
  otpCheck,
  changePassword,
};

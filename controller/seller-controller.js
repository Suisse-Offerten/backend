require("dotenv").config();
const SellerModel = require("../models/seller-model");
const ClientModel = require("../models/client-model");
const OTPModel = require("../models/otp-model");
const ReviewModel = require("../models/review-model");
const bcrypt = require("bcrypt");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const SECRET_KEY = process.env.SECRET_KEY;
const baseURL = process.env.CORS_URL;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const jwt = require("jsonwebtoken");
const {
  SERVER_ERROR_MESSAGE,
  ID_REQUIRED_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  EMAIL_ALREADY_EXIST_MESSAGE,
  USERNAME_ALREADY_EXIST_MESSAGE,
  UID_ALREADY_EXIST_MESSAGE,
  REGISTRATION_VERIFY_OTP_MESSAGE,
  INVALID_TOEKN_MESSAGE,
  EMAIL_VERIFICATOPM_SUCCESS_MESSAGE,
  SELLER_EMAIL_NOT_VERIFYED_MESSAGE,
  INCORRECT_PASSWORD_MESSAGE,
  LOGIN_SUCCESSFUL_MESSAGE,
  OTP_SEND_SUCCESS_MESSAGE,
  TOKEN_EXPIRED_MESSAGE,
  OTP_MATCH_SUCCESS_MESSAGE,
  OTP_NOT_MATCH_MESSAGE,
  PASSWORD_CHANGE_SUCCESS_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  PLEASE_VERIFY_EMAIL_UID_MESSAGE,
  ACTIVITY_SAVED_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
  ACCOUNT_CREATE_SUCCESS_MESSAGE,
  LINK_SEND_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  PLEASE_VERIFY_EMAIL_ADDRESS_RESPONSE,
  CLICK_TO_VERIFY_RESPONSE,
  PLEASE_LOGIN_TO_SEE_PROCESS_RESPONSE,
  EMAIL_VERIFICATION_RESPONSE,
  RESET_PASSWORD_RESPONSE,
  YOUR_OTP_RESPONSE,
  GET_OTP_RESPONSE,
  NEW_NOTIFICATION_RESPONSE,
  GOOD_NEWS_RESPONSE,
  MESSAGE_RESPONSE,
  CHANGE_PASSWORD_RESPONSE,
  GET_NOT_RESET_EMAIL_RESPONSE,
  GET_RESET_PASSWORD_LINK_RESPONSE,
  CHANGE_PASSWORD_LINK_RESPONSE,
  OUTRO_RESPONSE,
  SINGNATURE_RESPONSE,
  LOGIN_TO_REPLY_MESSAGE_RESPONSE,
} = require("../utils/email.response");
const supportMail = process.env.SUPPORT_MAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const corsUrl = process.env.CORS_URL;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// Get All Seller
async function getAllSeller(req, res) {
  try {
    const { page = 1, limit = 20, category, location } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const filter = {};
    if (category) {
      filter.categoryCode = { $in: [Number(category)] };
    }
    if (location) {
      filter.location = location;
    }
    const skip = (pageNumber - 1) * limitNumber;
    const sellers = await SellerModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const datas = await Promise.all(
      sellers.map(async (seller) => {
        const latestReview = await ReviewModel.findOne({
          sellerId: seller._id,
        }).sort({ createdAt: -1 });
        return {
          ...seller._doc,
          reviewData: latestReview || null,
        };
      })
    );

    const totalSellers = await SellerModel.countDocuments(filter);
    const totalPages = Math.ceil(totalSellers / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalSellers,
      sellers: datas,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all seller by admin
async function getAllSellersByAdmin(req, res) {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const sellers = await SellerModel.find(filter)
      .skip(skip)
      .limit(limitNumber);

    const totalSellers = await SellerModel.countDocuments(filter);
    const totalPages = Math.ceil(totalSellers / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalSellers,
      sellers: sellers,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get Single Seller
async function getOneSeller(req, res) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: ID_REQUIRED_ERROR_MESSAGE });
  }
  try {
    const existSeller = await SellerModel.findOne({ _id: id });

    if (!existSeller) {
      return res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    } else {
      return res.status(200).json(existSeller);
    }
  } catch (error) {
    return res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Register Seller
async function register(req, res) {
  const {
    companyName,
    UIDNumber,
    person,
    email,
    phone,
    furtherInfo,
    username,
    referance,
    password,
    agreement,
  } = req.body;
  const existSellerByEmail = await SellerModel.findOne({ email: email });
  const existSellerByUIDNumber = await SellerModel.findOne({
    UIDNumber: UIDNumber,
  });
  const existSellerByUsername = await SellerModel.findOne({
    username: username,
  });
  const existClient = await ClientModel.findOne({
    email: email,
  });

  try {
    if (existSellerByEmail || existClient) {
      return res.status(404).json({ message: EMAIL_ALREADY_EXIST_MESSAGE });
    }
    if (existSellerByUsername) {
      return res.status(404).json({ message: USERNAME_ALREADY_EXIST_MESSAGE });
    }
    if (existSellerByUIDNumber) {
      return res.status(404).json({ message: UID_ALREADY_EXIST_MESSAGE });
    }
    bcrypt.hash(password, 10, async function (err, hash) {
      const newSeller = new SellerModel({
        companyName,
        UIDNumber,
        person,
        email,
        phone,
        furtherInfo,
        username,
        referance,
        agreement,
        password: hash,
      });
      await newSeller.save();
      const token = jwt.sign(
        { id: newSeller._id, email: newSeller.email },
        SECRET_KEY,
        { expiresIn: "1d" }
      );
      await sendVerificationEmail(companyName, email, token);
      res.status(201).json({
        seller: newSeller,
        message: REGISTRATION_VERIFY_OTP_MESSAGE,
      });
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// email send for varification
async function sendVerificationEmail(companyName, email, token) {
  let config = {
    host: SMTP,
    port: PORT,
    secure: false,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  };
  const transporter = nodemailer.createTransport(config);
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: NAME_RESPONSE,
      link: DOMAIN_URL_RESPONSE,
      copyright: OUTRO_RESPONSE,
    },
  });
  const emailTemplate = {
    body: {
      name: `${companyName}`,
      intro: `${PLEASE_VERIFY_EMAIL_ADDRESS_RESPONSE}`,
      signature: SINGNATURE_RESPONSE,
      action: {
        instructions: CLICK_TO_VERIFY_RESPONSE,
        button: {
          color: "#22BC66",
          text: "E-Mail bestätigen.",
          link: `${baseURL}/verify-email/${token}`,
        },
      },
      outro: `<p style="font-size: 14px; color: #777;">${PLEASE_LOGIN_TO_SEE_PROCESS_RESPONSE}, Armaturenbrett: <a href="${corsUrl}/seller-dashboard" style="font-weight: bold;">${corsUrl}/seller-dashboard</a></p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>`,
    },
  };
  const emailBody = mailGenerator.generate(emailTemplate);
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: EMAIL_VERIFICATION_RESPONSE,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

// seller email varification
async function sellerEmailVarification(req, res) {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const seller = await SellerModel.findById(decoded.id);

    if (!seller) {
      return res.status(400).json({ message: INVALID_TOEKN_MESSAGE });
    }
    seller.emailVerify = true;
    await seller.save();

    return res
      .status(200)
      .json({ message: EMAIL_VERIFICATOPM_SUCCESS_MESSAGE });
  } catch (error) {
    return res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Login Seller
async function login(req, res) {
  const { input, password } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let email;
  let username;
  if (emailPattern.test(input)) {
    email = input;
  } else {
    username = input;
  }
  const existSellerByEmail = await SellerModel.findOne({ email: email });
  const existSellerByUsername = await SellerModel.findOne({
    username: username,
  });

  try {
    if (email) {
      if (!existSellerByEmail) {
        return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
      }
      if (!existSellerByEmail?.emailVerify) {
        return res
          .status(404)
          .json({ message: SELLER_EMAIL_NOT_VERIFYED_MESSAGE });
      }
    }

    if (username) {
      if (!existSellerByUsername) {
        return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
      }
      if (!existSellerByUsername?.emailVerify) {
        return res
          .status(404)
          .json({ message: SELLER_EMAIL_NOT_VERIFYED_MESSAGE });
      }
    }

    const matchpassword = await bcrypt.compare(
      password,
      existSellerByEmail
        ? existSellerByEmail.password
        : existSellerByUsername.password
    );
    if (!matchpassword) {
      return res.status(400).json({ message: INCORRECT_PASSWORD_MESSAGE });
    }

    const token = jwt.sign(
      {
        email: existSellerByEmail
          ? existSellerByEmail.email
          : existSellerByUsername.email,
        id: existSellerByEmail
          ? existSellerByEmail._id
          : existSellerByUsername._id,
      },
      SECRET_KEY
    );
    res.status(200).json({
      seller: existSellerByEmail ? existSellerByEmail : existSellerByUsername,
      token: token,
      message: LOGIN_SUCCESSFUL_MESSAGE,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// OTP Send
async function otpSend(req, res) {
  const { email } = req.body;
  try {
    const existSeller = await SellerModel.findOne({ email: email });
    if (existSeller) {
      let otp = Math.floor(100000 + Math.random() * 900000).toString();
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
          name: existSeller?.email,
          intro: RESET_PASSWORD_RESPONSE,
          signature: SINGNATURE_RESPONSE,
          table: {
            data: [
              {
                Message: `${YOUR_OTP_RESPONSE} ${otp}`,
              },
            ],
          },
          outro: `<p style="font-size: 14px; color: #777;">${GET_OTP_RESPONSE}</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>`,
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
        return res.status(200).json({
          email: email,
          message: OTP_SEND_SUCCESS_MESSAGE,
          status: "ok",
        });
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
    let seller = await SellerModel.findOne({ email });
    if (seller) {
      bcrypt.hash(password, 10, async function (err, hash) {
        seller.password = hash;
        await seller.save();
        res.status(200).json({ message: PASSWORD_CHANGE_SUCCESS_MESSAGE });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// free tirel activated
async function freeTirelMembership(req, res) {
  const { id } = req.params;

  const existSeller = await SellerModel.findOne({
    _id: id,
  });
  if (!existSeller) {
    return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
  }

  const membershipData = {
    credits: existSeller?.credits + 20,
    freeTire: true,
  };
  await sendFreeTirelEmail(
    existSeller?.username,
    existSeller?.email,
    "Sie haben eine kostenlose Testversion aktiviert und 20 Credits erhalten. Jetzt können Sie auf jeden Job bieten."
  );
  await SellerModel.findByIdAndUpdate(id, membershipData, { new: true });
  res.status(200).json({ message: "Gratis-Reifen aktiviert" });
}

// change password by seller
async function changePasswordBySeller(req, res) {
  const { password } = req.body;
  const id = req.params.id;
  try {
    let seller = await SellerModel.findOne({ _id: id });
    if (seller) {
      bcrypt.hash(password, 10, async function (err, hash) {
        seller.password = hash;
        await seller.save();
        res.status(200).json({ message: PASSWORD_CHANGE_SUCCESS_MESSAGE });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update seller
async function updateSeller(req, res) {
  const {
    salutation,
    firstName,
    lastName,
    director,
    dirfirstname,
    dirlastname,
    companyName,
    leagalForm,
    foundingYear,
    website,
    UIDNumber,
    iban,
    streetNo,
    postalCode,
    location,
    phone,
    secondPhone,
    newsletter,
  } = req.body;

  const id = req.params.id;
  const existSeller = await SellerModel.findOne({ _id: id });
  try {
    if (existSeller) {
      const updateSeller = {
        salutation,
        firstName,
        lastName,
        director,
        dirfirstname,
        dirlastname,
        companyName,
        leagalForm,
        foundingYear,
        website,
        UIDNumber,
        iban,
        streetNo,
        postalCode,
        location,
        phone,
        secondPhone,
        newsletter,
      };
      await SellerModel.findByIdAndUpdate(id, updateSeller, {
        new: true,
      });
      res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update seller stqtus
async function updateSellerStatus(req, res) {
  const { status } = req.body;
  const id = req.params.id;
  const existSeller = await SellerModel.findOne({ _id: id });
  try {
    if (existSeller) {
      const newSellerStatus = {
        status: status,
      };
      await SellerModel.findByIdAndUpdate(id, newSellerStatus, {
        new: true,
      });
      res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update seller stqtus by admin
async function updateSellerStatusByAdmin(req, res) {
  const { role, id, status } = req.body;
  const existSeller = await SellerModel.findOne({ _id: id });
  try {
    if (existSeller) {
      if (role === "email") {
        if (status === "verified") {
          const emailVerify = {
            emailVerify: true,
          };
          await SellerModel.findByIdAndUpdate(id, emailVerify, {
            new: true,
          });
        } else {
          const emailVerify = {
            emailVerify: false,
          };
          await SellerModel.findByIdAndUpdate(id, emailVerify, {
            new: true,
          });
        }
      }
      if (role === "uid") {
        if (status === "verified") {
          const uidVerify = {
            uidVerify: true,
          };
          await SellerModel.findByIdAndUpdate(id, uidVerify, {
            new: true,
          });
          await sendEmailNotification(
            existSeller.username,
            existSeller.email,
            `${NEW_NOTIFICATION_RESPONSE}`,
            `UID`
          );
        } else {
          const uidVerify = {
            uidVerify: false,
          };
          await SellerModel.findByIdAndUpdate(id, uidVerify, {
            new: true,
          });
        }
      }
      if (role === "address") {
        if (existSeller?.emailVerify && existSeller?.uidVerify) {
          if (status === "verified") {
            const addressVerify = {
              locationVerify: true,
              status: "verified",
            };
            await SellerModel.findByIdAndUpdate(id, addressVerify, {
              new: true,
            });
            await sendEmailNotification(
              existSeller.username,
              existSeller.email,
              `${NEW_NOTIFICATION_RESPONSE}`,
              `Address`
            );
          } else {
            const addressVerify = {
              locationVerify: false,
            };
            await SellerModel.findByIdAndUpdate(id, addressVerify, {
              new: true,
            });
          }
        } else {
          return res
            .status(400)
            .json({ message: PLEASE_VERIFY_EMAIL_UID_MESSAGE });
        }
      }
      res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send notification email
async function sendEmailNotification(name, email, subject, verify) {
  let config = {
    host: SMTP,
    port: PORT,
    secure: false,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  };
  const transporter = nodemailer.createTransport(config);

  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: NAME_RESPONSE,
      link: DOMAIN_URL_RESPONSE,
      copyright: OUTRO_RESPONSE,
    },
  });
  const emailTemplate = {
    body: {
      name: `${name}`,
      intro: `${GOOD_NEWS_RESPONSE}...`,
      signature: SINGNATURE_RESPONSE,
      outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${MESSAGE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">Ihre ${verify} wurde verifiziert</p>
        </div>
        <p style="font-size: 14px; color: #777;">${PLEASE_LOGIN_TO_SEE_PROCESS_RESPONSE}, Armaturenbrett: <a href="${corsUrl}/seller-dashboard" style="font-weight: bold;">${corsUrl}/seller-dashboard</a></p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
      `,
    },
  };
  const emailBody = mailGenerator.generate(emailTemplate);
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: subject,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

// update seller company info
async function updateSellerCompany(req, res) {
  const {
    companyDescription,
    companyTitle,
    companyInfo,
    companyLogo,
    companyCover,
  } = req.body;
  const id = req.params.id;
  try {
    const existSeller = await SellerModel.findById(id);
    if (!existSeller) {
      return res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
    const basePath = `${req.protocol}://${req.get("host")}/uploads/`;
    const Logo = req.files?.companyLogo?.[0]?.filename;
    const Cover = req.files?.companyCover?.[0]?.filename;

    const updateSeller = {
      companyDescription,
      companyTitle,
      companyLogo: Logo ? `${basePath}${Logo}` : companyLogo,
      companyCover: Cover ? `${basePath}${Cover}` : companyCover,
      companyInfo: Array.isArray(companyInfo) ? companyInfo : [],
    };
    if (req.files?.companyPictures && req.files.companyPictures.length > 0) {
      updateSeller.companyPictures = req.files.companyPictures.map(
        (file) => `${basePath}${file.filename}`
      );
    }
    await SellerModel.findByIdAndUpdate(id, updateSeller, { new: true });
    res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update seller by admin
async function updateSellerByAdmin(req, res) {
  const {
    companyName,
    UIDNumber,
    phone,
    email,
    username,
    person,
    credits,
    director,
    dirfirstname,
    dirlastname,
    firstName,
    lastName,
    foundingYear,
    iban,
    leagalForm,
    location,
    postalCode,
    salutation,
    streetNo,
    secondPhone,
    website,
    companyDescription,
    companyTitle,
  } = req.body;
  const id = req.params.id;
  try {
    const existSeller = await SellerModel.findById(id);
    if (!existSeller) {
      return res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
    const basePath = `${req.protocol}://${req.get("host")}/uploads/`;
    const companyLogo = req.files?.companyLogo?.[0]?.filename
      ?.split(" ")
      .join("-");
    const companyCover = req.files?.companyCover?.[0]?.filename
      ?.split(" ")
      .join("-");

    const updateSeller = {
      companyName,
      UIDNumber,
      phone,
      email,
      username,
      person,
      credits,
      director,
      dirfirstname,
      dirlastname,
      firstName,
      lastName,
      foundingYear,
      iban,
      leagalForm,
      location,
      postalCode,
      salutation,
      streetNo,
      secondPhone,
      website,
      companyDescription,
      companyTitle,
      companyLogo: companyLogo
        ? `${basePath}${companyLogo}`
        : existSeller?.companyLogo,
      companyCover: companyCover
        ? `${basePath}${companyCover}`
        : existSeller?.companyCover,
    };
    if (req.files?.companyPictures && req.files.companyPictures.length > 0) {
      updateSeller.companyPictures = req.files.companyPictures.map(
        (file) => `${basePath}${file.filename}`
      );
    }
    await SellerModel.findByIdAndUpdate(id, updateSeller, { new: true });
    res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update seller credits
async function updateSellerCredits(req, res) {
  const { credits } = req.body;
  const id = req.params.id;
  try {
    const updateSeller = {
      credits,
    };
    await SellerModel.findByIdAndUpdate(id, updateSeller, { new: true });
    res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update seller activity
async function updateSellerActivity(req, res) {
  const { activities, locations, categoryCode, categories } = req.body;
  const { id } = req.params;
  const existSeller = await SellerModel.findOne({ _id: id });
  try {
    if (existSeller) {
      const newSellerActivity = {
        activities: [...activities],
        preference: [...locations],
        categories: [...categories],
        categoryCode: [...categoryCode],
      };
      await SellerModel.findByIdAndUpdate(id, newSellerActivity, {
        new: true,
      });
      res.status(200).json({ message: ACTIVITY_SAVED_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update seller activity
async function updateSellerActivityByAdmin(req, res) {
  const { activities, locations } = req.body;
  const { id } = req.params;
  const existSeller = await SellerModel.findOne({ _id: id });
  try {
    if (existSeller) {
      const newSellerActivity = {
        activities: [...activities],
        preference: [...locations],
      };
      await SellerModel.findByIdAndUpdate(id, newSellerActivity, {
        new: true,
      });
      res.status(200).json({ message: ACTIVITY_SAVED_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Delete seller
async function deleteSeller(req, res) {
  const id = req.params.id;
  let existSeller = await SellerModel.findOne({ _id: id });
  try {
    if (existSeller) {
      await SellerModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create seller by admin
async function createSellerByAdmin(req, res) {
  const { username, email, phone, password } = req.body;
  const existSellerByEmail = await SellerModel.findOne({ email: email });

  const existSellerByUsername = await SellerModel.findOne({
    username: username,
  });
  const existClient = await ClientModel.findOne({
    email: email,
  });
  try {
    if (existSellerByEmail || existClient) {
      return res.status(404).json({ message: EMAIL_ALREADY_EXIST_MESSAGE });
    }
    if (existSellerByUsername) {
      return res.status(404).json({ message: USERNAME_ALREADY_EXIST_MESSAGE });
    }
    bcrypt.hash(password, 10, async function (err, hash) {
      const createSeller = await new SellerModel({
        username,
        email,
        phone,
        password: hash,
      });
      await createSeller.save();
      res.status(201).json({ message: ACCOUNT_CREATE_SUCCESS_MESSAGE });
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Delete company pictures
async function deleteSellerCompanyPictures(req, res) {
  const { item, role } = req.body;
  const { id } = req.params;
  try {
    const existSeller = await SellerModel.findOne({ _id: id });
    let updateSeller;

    if (existSeller) {
      if (role === "cover") {
        updateSeller = await SellerModel.findByIdAndUpdate(
          id,
          { companyCover: null },
          { new: true }
        );
      } else if (role === "logo") {
        updateSeller = await SellerModel.findByIdAndUpdate(
          id,
          { companyLogo: null },
          { new: true }
        );
      } else {
        updateSeller = await SellerModel.findByIdAndUpdate(
          id,
          { $pull: { companyPictures: item } },
          { new: true }
        );
      }
      res
        .status(200)
        .json({ message: DELETE_SUCCESS_MESSAGE, updatedSeller: updateSeller });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Upload seller address
async function uploadSellerAddress(req, res) {
  const { postalCode, streetNo, location } = req.body;
  const { id } = req.params;
  try {
    const existSeller = await SellerModel.findOne({ _id: id });
    if (existSeller) {
      const basePath = `${req.protocol}://${req.get("host")}/uploads/`;
      const file = req?.file?.filename;
      const updateData = {
        postalCode,
        streetNo,
        location,
        addressFile: `${basePath ? `${basePath}${file}` : "null"}`,
      };
      await SellerModel.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send reset password link
async function sendResetPasswordLink(req, res) {
  const { email } = req.body;
  try {
    const existSeller = await SellerModel.findOne({ email: email });
    if (existSeller) {
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
          name: existSeller?.email,
          intro: CHANGE_PASSWORD_RESPONSE,
          signature: SINGNATURE_RESPONSE,
          table: {
            data: [
              {
                Message: `${GET_NOT_RESET_EMAIL_RESPONSE} URL: ${corsUrl}/seller-change-password`,
              },
            ],
          },
          outro: `<p style="font-size: 14px; color: #777;">${GET_RESET_PASSWORD_LINK_RESPONSE}, <a href="${corsUrl}/seller-dashboard" style="font-weight: bold;">Armaturenbrett</a></p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>`,
        },
      };
      let mail = await mailGenarator.generate(response);
      let message = {
        from: EMAIL,
        to: req.body.email,
        subject: CHANGE_PASSWORD_LINK_RESPONSE,
        html: mail,
      };
      transport.sendMail(message).then(() => {
        return res.status(200).json({
          email: email,
          message: LINK_SEND_SUCCESS_MESSAGE,
          status: "ok",
        });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send mail notification
async function sendFreeTirelEmail(name, email, message) {
  let config = {
    host: SMTP,
    port: PORT,
    secure: false,
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  };

  const transporter = nodemailer.createTransport(config);
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: NAME_RESPONSE,
      link: DOMAIN_URL_RESPONSE,
      copyright: OUTRO_RESPONSE,
    },
  });
  const emailTemplate = {
    body: {
      name: `${name}`,
      intro: "Sie haben eine kostenlose Testversion aktiviert",
      signature: SINGNATURE_RESPONSE,
      outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${MESSAGE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${message}</p>
        </div>
        <p style="font-size: 14px; color: #777;">${LOGIN_TO_REPLY_MESSAGE_RESPONSE}</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
      `,
    },
  };
  emailTemplate.body.message = `${message}`;
  const emailBody = mailGenerator.generate(emailTemplate);
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: "Sie haben eine kostenlose Testversion aktiviert",
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = {
  getAllSeller,
  getOneSeller,
  register,
  login,
  otpCheck,
  otpSend,
  changePassword,
  updateSeller,
  deleteSeller,
  updateSellerStatus,
  updateSellerActivity,
  updateSellerCompany,
  sellerEmailVarification,
  getAllSellersByAdmin,
  updateSellerStatusByAdmin,
  createSellerByAdmin,
  deleteSellerCompanyPictures,
  uploadSellerAddress,
  changePasswordBySeller,
  updateSellerByAdmin,
  sendResetPasswordLink,
  updateSellerCredits,
  updateSellerActivityByAdmin,
  freeTirelMembership,
};

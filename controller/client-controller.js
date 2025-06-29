require("dotenv").config();
const ClientModel = require("../models/client-model");
const SellerModel = require("../models/seller-model");
const OTPModel = require("../models/otp-model");
const VerifyModel = require("../models/verify-model");
const JobModel = require("../models/job-model");
const bcrypt = require("bcrypt");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const SECRET_KEY = process.env.SECRET_KEY;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const jwt = require("jsonwebtoken");
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  EMAIL_ALREADY_EXIST_MESSAGE,
  USERNAME_ALREADY_EXIST_MESSAGE,
  REGISTRATION_VERIFY_OTP_MESSAGE,
  ALREADY_VERIFY_MESSAGE,
  VERIFICATION_SUCCESS_MESSAGE,
  ENTER_WRONG_CODE_MESSAGE,
  VERIFY_YOUR_ACCOUNT_MESSAGE,
  INCORRECT_PASSWORD_MESSAGE,
  LOGIN_SUCCESSFUL_MESSAGE,
  OTP_SEND_SUCCESS_MESSAGE,
  TOKEN_EXPIRED_MESSAGE,
  OTP_MATCH_SUCCESS_MESSAGE,
  OTP_NOT_MATCH_MESSAGE,
  PASSWORD_CHANGE_SUCCESS_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
  ACCOUNT_CREATE_SUCCESS_MESSAGE,
  LINK_SEND_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  WELCOME_DATA_RESPONSE,
  GET_VERIFICATION_CODE_RESPONSE,
  EMAIL_VERIFICATION_CODE_RESPONSE,
  NEW_JOB_POSTED_RESPONSE,
  JOB_TITLE_RESPONSE,
  JOB_DESCRIPTION_RESPONSE,
  JOB_LOCATION_RESPONSE,
  JOB_NUMBER_RESPONSE,
  SEE_JOBS_RESPONSE,
  RESET_PASSWORD_RESPONSE,
  YOUR_OTP_RESPONSE,
  USE_OTP_TO_CHANGE_PASSWORD_RESPONSE,
  CHANGE_PASSWORD_RESPONSE,
  CHANGE_PASSWORD_DATA_MESSAGE_RESPONSE,
  GET_RESET_PASSWORD_LINK_RESPONSE,
  CHANGE_PASSWORD_LINK_RESPONSE,
  OUTRO_RESPONSE,
  SINGNATURE_RESPONSE,
} = require("../utils/email.response");
const supportMail = process.env.SUPPORT_MAIL;
const corsUrl = process.env.CORS_URL;

// Get All Client
async function getClient(req, res) {
  try {
    const data = await ClientModel.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all client by admin
async function getAllClientsByAdmin(req, res) {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const clients = await ClientModel.find(filter)
      .skip(skip)
      .limit(limitNumber);

    const totalClients = await ClientModel.countDocuments(filter);
    const totalPages = Math.ceil(totalClients / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalClients,
      clients: clients,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get client by id
async function getClientById(req, res) {
  const id = req.params.id;
  const existClient = await ClientModel.findOne({ _id: id });
  try {
    if (!existClient) {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    } else {
      res.status(200).json(existClient);
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get client by email
async function getClientByEmail(req, res) {
  const { jobEmail } = req.query;
  const existClient = await ClientModel.findOne({ email: jobEmail });
  try {
    if (!existClient) {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    } else {
      res.status(200).json(existClient);
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Register Client
async function register(req, res) {
  const {
    salutation,
    firstname,
    lastname,
    email,
    phone,
    secondPhone,
    username,
    referance,
    password,
    agreement,
  } = req.body;
  const existCleintByEmail = await ClientModel.findOne({ email: email });
  const existSeller = await SellerModel.findOne({ email: email });
  const existCleintByUsername = await ClientModel.findOne({
    username: username,
  });
  try {
    if (existCleintByEmail || existSeller) {
      return res.status(404).json({ message: EMAIL_ALREADY_EXIST_MESSAGE });
    }
    if (existCleintByUsername) {
      return res.status(404).json({ message: USERNAME_ALREADY_EXIST_MESSAGE });
    }
    bcrypt.hash(password, 10, async function (err, hash) {
      const newClient = new ClientModel({
        salutation,
        firstname,
        lastname,
        email,
        phone,
        secondPhone,
        username,
        referance,
        agreement,
        password: hash,
      });
      await newClient.save();
      await sendVerificationCode(username, email);
      res.status(201).json({
        client: newClient,
        message: REGISTRATION_VERIFY_OTP_MESSAGE,
      });
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send varification code
async function sendVerificationCode(companyName, email) {
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  let otpData = new VerifyModel({
    email,
    code: verificationCode,
  });
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
      intro: WELCOME_DATA_RESPONSE,
      signature: SINGNATURE_RESPONSE,
      table: {
        data: [
          {
            "Your Verification Code": verificationCode,
          },
        ],
      },
      outro: `
        <p style="font-size: 14px; color: #777;">${GET_VERIFICATION_CODE_RESPONSE}</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
      `,
    },
  };
  const emailBody = mailGenerator.generate(emailTemplate);
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: EMAIL_VERIFICATION_CODE_RESPONSE,
    html: emailBody,
  };

  await transporter.sendMail(mailOptions);
  await otpData.save();
  return verificationCode;
}

// check verify code
async function VerifyCodeCheck(req, res) {
  try {
    const data = await VerifyModel.findOne({ code: req.body.code });
    const { email } = data || {};
    if (data) {
      const existClient = await ClientModel.findOne({ email: email });
      const existJob = await JobModel.findOne({ jobEmail: email });

      const matchingSellers = await SellerModel.find({
        $and: [
          { preference: { $in: existJob?.jobCity } },
          { activities: { $in: existJob?.jobSubCategories } },
        ],
      });
      if (existClient?.status === "verified") {
        return res.status(500).json({ message: ALREADY_VERIFY_MESSAGE });
      }

      const sellerEmails = matchingSellers.map((seller) => seller.email);
      const sellerNames = matchingSellers.map((seller) => seller.username);
      const updateClient = {
        status: "verified",
      };
      const updateJob = {
        status: "active",
      };
      const id = existClient?._id;
      await ClientModel.findByIdAndUpdate(id, updateClient, { new: true });
      await JobModel.findByIdAndUpdate(existJob?._id, updateJob, { new: true });
      if (existJob) {
        await sendJobEmails(
          sellerEmails,
          existJob?.jobTitle,
          existJob?.jobDescription,
          existJob?.jobLocation,
          existJob?.jobNumber,
          sellerNames
        );
      }
      res.status(200).json({ message: VERIFICATION_SUCCESS_MESSAGE });
    } else {
      res.status(500).json({ message: ENTER_WRONG_CODE_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send email to all seller after client verify their email
async function sendJobEmails(
  sellerEmails,
  jobTitle,
  jobDescription,
  jobLocation,
  uniqueNumber,
  sellerNames
) {
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
  for (let i = 0; i < sellerNames.length; i++) {
    const emailTemplate = {
      body: {
        name: sellerNames[i],
        intro: `${NEW_JOB_POSTED_RESPONSE}: ${jobTitle}`,
        signature: SINGNATURE_RESPONSE,
        outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${JOB_TITLE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${jobTitle}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${JOB_DESCRIPTION_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${jobDescription}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${JOB_LOCATION_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${jobLocation}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${JOB_NUMBER_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${uniqueNumber}</p>
        </div>
        <p style="font-size: 14px; color: #777;">Visit this link to see recent jobs <a href="${corsUrl}/search-job">${SEE_JOBS_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
      `,
      },
    };

    const emailBody = mailGenerator.generate(emailTemplate);

    const message = {
      from: EMAIL,
      to: sellerEmails[i],
      subject: `${NEW_JOB_POSTED_RESPONSE}: ${jobTitle}`,
      html: emailBody,
    };
    await transporter.sendMail(message);
  }
}

// Login Client
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
  try {
    const existClientByEmail = await ClientModel.findOne({ email: email });
    const existClientByUsername = await ClientModel.findOne({
      username: username,
    });

    if (email) {
      if (!existClientByEmail) {
        return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
      }
      if (existClientByEmail?.status === "pending") {
        return res.status(404).json({ message: VERIFY_YOUR_ACCOUNT_MESSAGE });
      }
    }
    if (username) {
      if (!existClientByUsername) {
        return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
      }
      if (existClientByUsername?.status === "pending") {
        return res.status(404).json({ message: VERIFY_YOUR_ACCOUNT_MESSAGE });
      }
    }
    const matchpassword = await bcrypt.compare(
      password,
      existClientByEmail
        ? existClientByEmail.password
        : existClientByUsername.password
    );
    if (!matchpassword) {
      return res.status(400).json({ message: INCORRECT_PASSWORD_MESSAGE });
    }

    const token = jwt.sign(
      {
        email: existClientByEmail
          ? existClientByEmail.email
          : existClientByUsername.email,
        id: existClientByEmail
          ? existClientByEmail._id
          : existClientByUsername._id,
      },
      SECRET_KEY
    );
    res.status(200).json({
      client: existClientByEmail ? existClientByEmail : existClientByUsername,
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
    const existClient = await ClientModel.findOne({ email: email });
    if (existClient) {
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
          name: existClient?.email,
          intro: RESET_PASSWORD_RESPONSE,
          signature: SINGNATURE_RESPONSE,
          table: {
            data: [
              {
                Message: `${YOUR_OTP_RESPONSE}: ${otp}`,
              },
            ],
          },
          outro: `<p style="font-size: 14px; color: #777;">${USE_OTP_TO_CHANGE_PASSWORD_RESPONSE}</p>
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
    let client = await ClientModel.findOne({ email });
    if (client) {
      bcrypt.hash(password, 10, async function (err, hash) {
        client.password = hash;
        await client.save();
        res.status(200).json({ message: PASSWORD_CHANGE_SUCCESS_MESSAGE });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// change password by client
async function changePasswordByClient(req, res) {
  const { password } = req.body;
  const id = req.params.id;
  try {
    let client = await ClientModel.findOne({ _id: id });
    if (client) {
      bcrypt.hash(password, 10, async function (err, hash) {
        client.password = hash;
        await client.save();
        res.status(200).json({ message: PASSWORD_CHANGE_SUCCESS_MESSAGE });
      });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update Client
async function updateClient(req, res) {
  const {
    salutation,
    firstname,
    lastname,
    email,
    phone,
    secondPhone,
    username,
    referance,
    agreement,
    newsletter,
  } = req.body;
  const id = req.params.id;
  const existClient = await ClientModel.findOne({ _id: id });
  try {
    if (existClient) {
      const updateClient = {
        salutation,
        firstname,
        lastname,
        email,
        phone,
        secondPhone,
        username,
        referance,
        agreement,
        newsletter,
      };
      await ClientModel.findByIdAndUpdate(id, updateClient, {
        new: true,
      });
      res
        .status(200)
        .json({ client: updateClient, message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update Client stqtus
async function updateClientStatus(req, res) {
  const { status } = req.body;
  const id = req.params.id;
  const existClient = await ClientModel.findOne({ _id: id });
  try {
    if (existClient) {
      const newClientStatus = {
        status: status,
      };
      await ClientModel.findByIdAndUpdate(id, newClientStatus, {
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

// update client status by admin
async function updateClientStatusByAdmin(req, res) {
  const { id, status } = req.body;
  const existClient = await ClientModel.findOne({ _id: id });
  try {
    if (existClient) {
      const emailVerify = {
        status: status,
      };
      await ClientModel.findByIdAndUpdate(id, emailVerify, {
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

// Delete Client
async function deleteClient(req, res) {
  const id = req.params.id;
  let existClient = await ClientModel.findOne({ _id: id });
  try {
    if (existClient) {
      await ClientModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create client by admin
async function createClientByAdmin(req, res) {
  const { username, email, phone, password } = req.body;
  const existClientByEmail = await ClientModel.findOne({ email: email });

  const existClientByUsername = await ClientModel.findOne({
    username: username,
  });
  const existSeller = await SellerModel.findOne({
    email: email,
  });
  try {
    if (existClientByEmail || existSeller) {
      return res.status(404).json({ message: EMAIL_ALREADY_EXIST_MESSAGE });
    }
    if (existClientByUsername) {
      return res.status(404).json({ message: USERNAME_ALREADY_EXIST_MESSAGE });
    }
    bcrypt.hash(password, 10, async function (err, hash) {
      const createClient = await new ClientModel({
        username,
        email,
        phone,
        password: hash,
      });
      await createClient.save();
      res.status(201).json({ message: ACCOUNT_CREATE_SUCCESS_MESSAGE });
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send reset password link
async function sendResetPasswordLink(req, res) {
  const { email } = req.body;
  try {
    const existSeller = await ClientModel.findOne({ email: email });
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
                Message: `${CHANGE_PASSWORD_DATA_MESSAGE_RESPONSE}. URL: https://suisse-offerten.ch/client-change-password`,
              },
            ],
          },
          outro: `<p style="font-size: 14px; color: #777;">${GET_RESET_PASSWORD_LINK_RESPONSE}</p>
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

module.exports = {
  getClient,
  getClientById,
  getClientByEmail,
  register,
  login,
  otpCheck,
  otpSend,
  changePassword,
  updateClient,
  deleteClient,
  updateClientStatus,
  VerifyCodeCheck,
  getAllClientsByAdmin,
  updateClientStatusByAdmin,
  createClientByAdmin,
  changePasswordByClient,
  sendResetPasswordLink,
};

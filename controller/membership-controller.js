const MembershipModel = require("../models/membership.model");
const SellerModel = require("../models/seller-model");
const {
  SERVER_ERROR_MESSAGE,
  MEMBERSHIP_CREATE_SUCCESS_MESSAGE,
  MEMBERSHIP_CANCEL_SUCCESS_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const {
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  OUTRO_RESPONSE,
  PAYMENT_HAS_COMPLETE_RESPONSE,
  SINGNATURE_RESPONSE,
  MESSAGE_RESPONSE,
  LOGIN_TO_REPLY_MESSAGE_RESPONSE,
  PAYMENT_SUBJECT_RESPONSE,
} = require("../utils/email.response");
const supportMail = process.env.SUPPORT_MAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const corsUrl = process.env.CORS_URL;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// get one Membership
async function getOneMembership(req, res) {
  const { id } = req.params;
  try {
    const Membership = await MembershipModel.findOne({ _id: id });
    res.status(200).json(Membership);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all Membership
async function getAllMembership(req, res) {
  try {
    const Membership = await MembershipModel.find();
    res.status(200).json(Membership);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all Membership By Admin
async function getAllMembershipByAdmin(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const memberships = await MembershipModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const totalMemberships = await MembershipModel.countDocuments(filter);
    const totalPages = Math.ceil(totalMemberships / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalMemberships,
      memberships,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create Membership
async function createMembership(req, res) {
  const {
    title,
    savePrice,
    existPrice,
    currentPrice,
    shortNote,
    featureOne,
    featureTow,
    featureThree,
    featureFour,
    featureFive,
    credit,
    plan,
    status,
    planTime,
  } = req.body;
  try {
    const createData = new MembershipModel({
      title,
      savePrice,
      existPrice,
      currentPrice,
      shortNote,
      featureOne,
      featureTow,
      featureThree,
      featureFour,
      featureFive,
      credit,
      plan,
      status,
      planTime,
    });
    await createData.save();
    res.status(200).json({ message: MEMBERSHIP_CREATE_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// cancel Membership
async function cancelMembership(req, res) {
  const { id } = req.params;
  try {
    const existSeller = await SellerModel.findOne({ _id: id });
    if (!existSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    const { email, username } = existSeller;
    const customers = await stripe.customers.list({ email });
    if (customers.data.length === 0) {
      return res.status(400).json({ message: "Stripe customer not found" });
    }
    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });
    if (subscriptions.data.length === 0) {
      return res.status(400).json({ message: "No active subscription found" });
    }
    await stripe.subscriptions.cancel(subscriptions.data[0].id);
    const updateSeller = {
      $unset: { memberShip: "" },
      memberShipStatus: "canceled",
      credits: 0,
      membershipActive: "",
    };
    await sendEmailNotification(
      username,
      email,
      `Leider wurde Ihre Mitgliedschaft gekündigt. Bei Fragen wenden Sie sich bitte an unser Support-Team.`
    );
    await SellerModel.findByIdAndUpdate(id, updateSeller, { new: true });
    res.status(200).json({ message: MEMBERSHIP_CANCEL_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update Membership
async function updateMembership(req, res) {
  const { id } = req.params;
  const {
    title,
    savePrice,
    existPrice,
    currentPrice,
    shortNote,
    featureOne,
    featureTow,
    featureThree,
    featureFour,
    featureFive,
    status,
    planTime,
    plan,
  } = req.body;
  try {
    const existMembership = await MembershipModel.findOne({ _id: id });
    if (existMembership) {
      const updateData = {
        title,
        savePrice,
        existPrice,
        currentPrice,
        shortNote,
        featureOne,
        featureTow,
        featureThree,
        featureFour,
        featureFive,
        status,
        planTime,
        plan,
      };
      await MembershipModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(200).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// delete Membership
async function deleteMembership(req, res) {
  const { id } = req.params;
  const existMembership = await MembershipModel.findOne({ _id: id });

  try {
    if (existMembership) {
      await MembershipModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(200).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send mail notification
async function sendEmailNotification(name, email, message) {
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
      intro: `${PAYMENT_HAS_COMPLETE_RESPONSE}`,
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
    subject: PAYMENT_SUBJECT_RESPONSE,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = {
  getOneMembership,
  getAllMembership,
  createMembership,
  updateMembership,
  deleteMembership,
  cancelMembership,
  getAllMembershipByAdmin,
};

const TransactionModel = require("../models/transaction-model");
const SellerModel = require("../models/seller-model");
const { SERVER_ERROR_MESSAGE } = require("../utils/response");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const {
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  OUTRO_RESPONSE,
  SINGNATURE_RESPONSE,
  MESSAGE_RESPONSE,
  LOGIN_TO_REPLY_MESSAGE_RESPONSE,
  PAYMENT_HAS_COMPLETE_RESPONSE,
  PAYMENT_SUBJECT_RESPONSE,
} = require("../utils/email.response");
const supportMail = process.env.SUPPORT_MAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const corsUrl = process.env.CORS_URL;
const membershipSecret = process.env.MEMBERSHIP_WEBHOOK_SECRET;
const creditSecret = process.env.CREDIT_WEBHOOK_SECRET;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// membership webhook function
async function membershipWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, membershipSecret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const transaction = await TransactionModel.findOne({
        transactionId: session.id,
      });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      const existSeller = await SellerModel.findOne({ _id: sellerId });
      const { sellerId, memberShip } = transaction;
      const { credit, planTime } = memberShip || {};
      let membershipComplete;

      if (credit > 0) {
        membershipComplete = {
          credits: credit + existSeller?.extendCredit,
          planTime: planTime + existSeller?.extendTime,
          memberShip: existSeller?.extendMembership,
          extendCredit: 0,
          extendTime: 0,
          extendMembership: {},
        };
      } else {
        membershipComplete = {
          memberShipStatus: "Active",
          credits: credit,
          memberShip: memberShip,
          membershipActive: new Date().toISOString().replace("Z", "+00:00"),
        };
      }
      await SellerModel.findByIdAndUpdate(sellerId, membershipComplete, {
        new: true,
      });

      const { username, email } = existSeller || {};
      await sendEmailNotification(
        username,
        email,
        `Der Kauf der Mitgliedschaft war erfolgreich und Sie erhalten ${credit} Credits. Bitte überprüfen Sie Ihr Dashboard, um Ihre letzte Aktualisierung anzuzeigen.`
      );
    }
    res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// credit webhook function
async function creditWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, creditSecret);
    const session = event.data.object;
    const transaction = await TransactionModel.findOne({
      transactionId: session.id,
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    const { sellerId, memberShip } = transaction;
    const { credits } = memberShip || {};
    const existSeller = await SellerModel.findOne({ _id: sellerId });
    const creditComplete = {
      credits: existSeller?.credits + credits,
      pendingCredits: 0,
    };
    const creditFailed = {
      credits: 0,
    };
    const { username, email } = existSeller || {};

    if (event.type === "checkout.session.completed") {
      await SellerModel.findByIdAndUpdate(sellerId, creditComplete, {
        new: true,
      });
      await sendEmailNotification(
        username,
        email,
        `Der Kauf von Credits war erfolgreich und Sie erhalten ${credits} Credits. Bitte überprüfen Sie Ihr Dashboard, um Ihre aktuelle Aktualisierung anzuzeigen.`
      );
    } else {
      await SellerModel.findByIdAndUpdate(sellerId, creditFailed, {
        new: true,
      });
      await sendEmailNotification(
        username,
        email,
        "Der Guthabenkauf ist fehlgeschlagen. Bitte überprüfen Sie Ihr Dashboard, um Ihre letzte Aktualisierung anzuzeigen."
      );
    }
    res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send email notifications
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
        <p style="font-size: 14px; color: #777;">Tel: ${supportPhone}</p>
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

module.exports = { membershipWebhook, creditWebhook };

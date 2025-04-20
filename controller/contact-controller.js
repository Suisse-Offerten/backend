const ContactModel = require("../models/contact-model");
const SellerModel = require("../models/seller-model");
const ClientModel = require("../models/client-model");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const {
  SERVER_ERROR_MESSAGE,
  COMMUNICATION_NOT_FOUND_MESSAGE,
  MESSAGE_SEND_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  MESSAGE_FROM_RESPONSE,
  REQUEST_CREATOR_NAME_RESPONSE,
  REQUEST_CREATOR_EMAIL_RESPONSE,
  REQUEST_CREATOR_ROLE_RESPONSE,
  REQUEST_CREATOR_PHONE_RESPONSE,
  REQUEST_CREATOR_SERVICE_RESPONSE,
  REQUEST_CREATOR_NOTICE_RESPONSE,
  GET_MESSAGE_FROM_CONTACT_PAGE_RESPONSE,
  SINGNATURE_RESPONSE,
  OUTRO_RESPONSE,
} = require("../utils/email.response");
const supportMail = process.env.SUPPORT_MAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const corsUrl = process.env.CORS_URL;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// Get All contact
async function getAllContact(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const emails = await ContactModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const totalEmails = await ContactModel.countDocuments(filter);
    const totalPages = Math.ceil(totalEmails / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalEmails,
      emails,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get All seller emails
async function getAllSellerEmails(req, res) {
  try {
    const { page = 1, limit = 20, location, activitie } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (location && location.trim()) {
      filter.activities = { $in: [location] };
    }
    if (activitie && activitie.trim()) {
      filter.preference = { $in: [activitie] };
    }

    const emails = await SellerModel.find(filter).skip(skip).limit(limitNumber);
    const totalEmails = await SellerModel.countDocuments(filter);
    const totalPages = Math.ceil(totalEmails / limitNumber);

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalEmails,
      emails,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get All client emails
async function getAllClientEmails(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const emails = await ClientModel.find().skip(skip).limit(limitNumber);
    const totalEmails = await ClientModel.countDocuments();
    const totalPages = Math.ceil(totalEmails / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalEmails,
      emails,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get All contact by default
async function getAllContactDefault(req, res) {
  try {
    const emails = await ContactModel.find();
    res.status(200).json(emails);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get Single contact
async function getSingleContact(req, res) {
  const id = req.params.id;
  const existMessage = await ContactModel.findOne({ _id: id });
  try {
    if (!existMessage) {
      res.status(400).json({ message: COMMUNICATION_NOT_FOUND_MESSAGE });
    } else {
      res.status(200).json(existMessage);
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Create contact
async function createContact(req, res) {
  const { notice, name, email, phone, service, role } = req.body;
  try {
    const newMessage = new ContactModel({
      notice,
      name,
      email,
      phone,
      service,
      role,
      status: "unread",
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
        name: "Cheaf",
        intro: `${MESSAGE_FROM_RESPONSE}: ${email}`,
        signature: SINGNATURE_RESPONSE,
        outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${REQUEST_CREATOR_NAME_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${name}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${REQUEST_CREATOR_EMAIL_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${email}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${REQUEST_CREATOR_ROLE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${role}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${REQUEST_CREATOR_PHONE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${phone}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${REQUEST_CREATOR_SERVICE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${service}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${REQUEST_CREATOR_NOTICE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${notice}</p>
        </div>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
        <p style="font-size: 14px; color: #777;">Tel: ${supportPhone}</p>
      `,
      },
    };
    let mail = await mailGenarator.generate(response);
    let message = {
      from: EMAIL,
      to: EMAIL,
      replyTo: email,
      subject: GET_MESSAGE_FROM_CONTACT_PAGE_RESPONSE,
      html: mail,
    };

    await newMessage.save();
    transporter.sendMail(message).then(() => {
      return res
        .status(201)
        .json({ newMessage, message: MESSAGE_SEND_MESSAGE });
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update contact
async function updateContact(req, res) {
  const id = req.params.id;
  const { notice, name, email, phone, service, role } = req.body;
  const existMessage = await ContactModel.findOne({ _id: id });
  try {
    const updateMessage = {
      notice,
      name,
      email,
      phone,
      service,
      role,
    };
    if (existMessage) {
      await ContactModel.findByIdAndUpdate(id, updateMessage, {
        new: true,
      });

      res.status(200).json({ updateMessage, message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: COMMUNICATION_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Update contact status
async function updateContactStatus(req, res) {
  const { status, id } = req.body;
  const existMessage = await ContactModel.findOne({ _id: id });

  try {
    const updateMessage = {
      status,
    };
    if (existMessage) {
      await ContactModel.findByIdAndUpdate(id, updateMessage, {
        new: true,
      });

      res.status(200).json({ updateMessage, message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: COMMUNICATION_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Delete contact
async function deleteContact(req, res) {
  const id = req.params.id;
  let existMessage = await ContactModel.findOne({ _id: id });
  try {
    if (existMessage) {
      await ContactModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: COMMUNICATION_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

module.exports = {
  createContact,
  getAllContact,
  getSingleContact,
  updateContact,
  deleteContact,
  updateContactStatus,
  getAllContactDefault,
  getAllSellerEmails,
  getAllClientEmails,
};

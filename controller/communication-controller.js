const CommunicationModel = require("../models/communication-model");
const SellerModel = require("../models/seller-model");
const ClientModel = require("../models/client-model");
const JobModel = require("../models/job-model");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  NOT_ELIGABLE_FOR_BID_MESSAGE,
  ALREADY_SEND_MESSAGE,
  MESSAGE_SEND_MESSAGE,
  COMMUNICATION_MARK_SEEN_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  YOU_HAVE_RECIVE_RESPONSE,
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  MESSAGE_RESPONSE,
  LOGIN_TO_REPLY_MESSAGE_RESPONSE,
  OUTRO_RESPONSE,
  SINGNATURE_RESPONSE,
} = require("../utils/email.response");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const supportMail = process.env.SUPPORT_MAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const corsUrl = process.env.CORS_URL;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// get all communication
const getAllCommunication = async (req, res) => {
  try {
    const communication = await CommunicationModel.find();
    res.status(200).json(communication);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

// get all communication by client
const getAllCommunicationByClient = async (req, res) => {
  const { id } = req.query;
  const filter = {
    clientId: id,
  };
  try {
    const communication = await CommunicationModel.find(filter);
    res.status(200).json(communication);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

// get user communication
const getUserCommunication = async (req, res) => {
  try {
    const existCommunication = await CommunicationModel.find({
      jobId: req.params.id,
    });
    if (existCommunication) {
      res.status(200).json(existCommunication);
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

// get single communication
const getsingleCommunication = async (req, res) => {
  const id = req.params.id;
  try {
    const existCommunication = await CommunicationModel.findOne({ _id: id });
    if (existCommunication) {
      res.status(200).json(existCommunication);
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

// create communication
const createCommunication = async (req, res) => {
  const { clientId, sellerMessage, jobId, sellerId, clientMessage } = req.body;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const existClient = await ClientModel.findOne({ _id: clientId });
  const collectios = await CommunicationModel.find({ jobId: jobId });
  if (collectios.length >= 5) {
    return res.status(400).json({ message: NOT_ELIGABLE_FOR_BID_MESSAGE });
  }
  const existJob = await JobModel.findOne({ _id: jobId });
  const existSellerCom = await CommunicationModel.findOne({
    sellerId: sellerId,
    jobId: jobId,
  });
  if (existSellerCom) {
    return res.status(400).json({ message: ALREADY_SEND_MESSAGE });
  }
  try {
    if (existSeller) {
      const reviewData = new CommunicationModel({
        clientId,
        jobId,
        sellerId,
        view: "unseen",
        sellerMessage: sellerMessage
          ? [
              {
                message: sellerMessage,
                date: new Date(),
                time: new Date().getTime(),
              },
            ]
          : [],
        clientMessage: clientMessage
          ? [
              {
                message: clientMessage,
                date: new Date(),
                time: new Date().getTime(),
              },
            ]
          : [],
      });
      const bid = existJob.placeBid > 0 ? existJob.placeBid + 1 : 1;
      const updateJob = {
        placeBid: bid,
      };
      if (sellerMessage) {
        // Seller sent a message, send email to client
        if (existClient) {
          await sendEmailNotification(
            existClient.username,
            existClient.email,
            `${YOU_HAVE_RECIVE_RESPONSE} ${existSeller.username}`,
            sellerMessage,
            existSeller.username,
            existJob?.jobTitle,
            jobId
          );
        }
      } else if (clientMessage) {
        // Client sent a message, send email to seller
        if (existSeller) {
          await sendEmailNotification(
            existSeller.username,
            existSeller.email,
            `${YOU_HAVE_RECIVE_RESPONSE} ${existClient.username}`,
            clientMessage,
            existClient.username,
            existJob?.jobTitle,
            jobId
          );
        }
      }
      await JobModel.findByIdAndUpdate(jobId, updateJob, { new: true });
      await reviewData.save();
      res.status(201).json({ message: MESSAGE_SEND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

// update communication view
const updateCommunicationView = async (req, res) => {
  try {
    const { id, jobId } = req.body;
    const filter = {
      jobId: jobId,
      clientId: id,
    };
    const updateView = {
      view: "seen",
    };
    await CommunicationModel.updateMany(filter, updateView);
    res.status(200).json({
      message: COMMUNICATION_MARK_SEEN_MESSAGE,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

// update communication
const updateCommunication = async (req, res) => {
  const id = req.params.id;
  const { sellerMessage, clientMessage } = req.body;

  try {
    let existCommunication = await CommunicationModel.findById(id);
    const sellerId = existCommunication?.sellerId;
    const clientId = existCommunication?.clientId;
    const jobId = existCommunication?.jobId;
    const existJob = await JobModel.findOne({ _id: jobId });
    const existSeller = await SellerModel.findOne({ _id: sellerId });
    const existClient = await ClientModel.findOne({ _id: clientId });
    if (sellerMessage) {
      if (existClient) {
        await sendEmailNotification(
          existClient.username,
          existClient.email,
          `${YOU_HAVE_RECIVE_RESPONSE} ${existSeller.username}`,
          sellerMessage,
          existSeller.username,
          existJob?.jobTitle,
          jobId
        );
      }
    } else if (clientMessage) {
      if (existSeller) {
        await sendEmailNotification(
          existSeller.username,
          existSeller.email,
          `${YOU_HAVE_RECIVE_RESPONSE} ${existClient.username}`,
          clientMessage,
          existClient.username,
          existJob?.jobTitle,
          jobId
        );
      }
    }
    if (existCommunication) {
      let updateData = {};
      if (sellerMessage) {
        if (!updateData.$push) {
          updateData.$push = {};
        }

        updateData.$push.sellerMessage = {
          message: sellerMessage,
          date: new Date(),
          time: new Date().getTime(),
        };
      }
      if (clientMessage) {
        if (!updateData.$push) {
          updateData.$push = {};
        }

        updateData.$push.clientMessage = {
          message: clientMessage,
          date: new Date(),
          time: new Date().getTime(),
        };
      }
      await CommunicationModel.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ message: MESSAGE_SEND_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

// Send email notification
async function sendEmailNotification(
  name,
  email,
  subject,
  message,
  receiveName,
  jobTitle,
  id
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
  const emailTemplate = {
    body: {
      name: `${name}`,
      intro: `${YOU_HAVE_RECIVE_RESPONSE} ${receiveName}:`,
      signature: SINGNATURE_RESPONSE,
      outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px;">
          <strong style="font-size: 16px;">${MESSAGE_RESPONSE}:</strong>
          <p style="font-size: 14px; color: #555;">${message}</p>
        </div>
        <p style="font-size: 14px; color: #777; font-weight: bold;">${LOGIN_TO_REPLY_MESSAGE_RESPONSE}, ${jobTitle}: <a style="font-weight: bold;" href="${corsUrl}/search-job/${id}">${corsUrl}/search-job/${id}</a></p>
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
    subject: subject,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

// delete communication
const deleteCommunication = async (req, res) => {
  const id = req.params.id;
  let existCommunication = await CommunicationModel.findOne({ _id: id });
  try {
    if (existCommunication) {
      await CommunicationModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
};

module.exports = {
  getAllCommunication,
  getUserCommunication,
  getsingleCommunication,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  getAllCommunicationByClient,
  updateCommunicationView,
};

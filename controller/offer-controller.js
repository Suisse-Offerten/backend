const OfferModel = require("../models/offer-model");
const JobModel = require("../models/job-model");
const SellerModel = require("../models/seller-model");
const ClientModel = require("../models/client-model");
const CommunicationModel = require("../models/communication-model");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  BID_NOT_ACCEPT_MESSAGE,
  PARTICIPATION_SUCCESS_MESSAGE,
  ENOUGH_CREDIT_REQUIRE_MESSAGE,
  REQUEST_SEND_SUCCESS_MESSAGE,
  NOT_ELIGABLE_TO_SEND_BID_RESPONSE,
  ALREADY_SEND_BID_MESSAGE,
  BID_SEND_SUCCESS_MESSAGE,
  ALREADY_SEND_REQUEST_MESSAGE,
  SELLER_NOT_HAVE_ENOUGH_CREDIT_MESSAGE,
  COMMUNICATION_MARK_SEEN_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  REVIEW_REQUEST_SEND_MESSAGE,
  OFFER_ARCHIVED_SUCCESS_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  YOU_HAVE_RECIVE_RESPONSE,
  SEND_REQUEST_TO_JOB_RESPONSE,
  CHECK_DASHBOARD_TO_SEE_BID_RESPONSE,
  ASK_TO_MAKE_PROPOSAL_RESPONSE,
  MESSAGE_RESPONSE,
  SEND_OFFER_REQUEST_RESPONSE,
  ASK_TO_MAKE_OFFER_RESPONSE,
  LOGIN_TO_CHECK_OFFER_RESPONSE,
  PLACE_A_BID_RESPONSE,
  PRICE_UNIT_RESPONSE,
  OFFER_PRICE_RESPONSE,
  OFFER_NOTE_RESPONSE,
  DOWNLOAD_OFFER_FILE_RESPONSE,
  OFFER_FILE_RESPONSE,
  GOOD_NEWS_PROPOSAL_ACCEPT_RESPONSE,
  ACCEPT_OFFER_IN_THIS_JOB_RESPONSE,
  YOU_HAVE_GOOD_NEWS_RESPONSE,
  ACCEPT_OFFER_SUCCESS_RESPONSE,
  REJECT_OFFER_RESPONSE,
  SORRY_INFROM_RESPONSE,
  DID_NOT_ACCEPT_OFFER_RESPONSE,
  LOGIN_DASHBOARD_TO_SEE_DETAILS_RESPONSE,
  SORRY_TO_INFORM_OFFER_REJECT_RESPONSE,
  CLIENT_NAME_RESPONSE,
  CLIENT_EMAIL_RESPONSE,
  CLIENT_PHONE_RESPONSE,
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  GET_NEW_OFFER_RESPONSE,
  LOGIN_TO_REPLY_MESSAGE_RESPONSE,
  UPDATE_THERE_BID_RESPONSE,
  RECIVE_UPDATE_OFFER_RESPONSE,
  SEND_REVIEW_REQUEST_RESPONSE,
  ASK_TO_ADD_REVIEW_RESPONSE,
  LOGIN_DASHBOARD_TO_WRITE_REVIEW_RESPONSE,
  JOB_TITLE_RESPONSE,
  OFFER_HAS_DELETE_RESPONSE,
  OFFER_VAILATION_ERROR_RESPONSE,
  HAVE_QUESTION_ASK_CONTACT_RESPONSE,
  SINGNATURE_RESPONSE,
  OUTRO_RESPONSE,
  client_dashboard,
  SEE_JOBS_RESPONSE,
} = require("../utils/email.response");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const supportMail = process.env.SUPPORT_MAIL;
const corsUrl = process.env.CORS_URL;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// get one Offer
async function getOneOffer(req, res) {
  const { id } = req.params;
  try {
    const Offer = await OfferModel.findOne({ _id: id });
    res.status(200).json(Offer);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get one offer by jobId
async function getOneOfferByJobId(req, res) {
  const { id } = req.params;
  const { sellerId } = req.query;
  try {
    const Offer = await OfferModel.findOne({ jobId: id, sellerId: sellerId });
    const seller = await SellerModel.findById(sellerId);
    const job = await JobModel.findById(id);
    const enrichedOffer = {
      ...Offer.toObject(),
      seller,
      job,
    };
    res.status(200).json(enrichedOffer);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all Offer default
async function getAllOfferDefault(req, res) {
  try {
    const Offer = await OfferModel.find();
    res.status(200).json(Offer);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all offer
async function getAllOffer(req, res) {
  try {
    const { page = 1, limit = 20, id = "", sellerId = "" } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (sellerId) {
      filter.sellerId = sellerId;
    }
    if (id) {
      filter.jobId = id;
    }
    const offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);

    const totalOffers = await OfferModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limitNumber);
    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });
    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all offer by admin
async function getAllOfferByAdmin(req, res) {
  try {
    const { page = 1, limit = 20, status = "", jobId = "" } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (jobId) {
      filter.jobId = jobId;
    }

    const offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);
    const totalOffers = await OfferModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limitNumber);
    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });
    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all offer by seller
async function getAllOfferBySeller(req, res) {
  try {
    const { page, limit, status, sellerId } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (sellerId) {
      filter.sellerId = sellerId;
    }
    if (status) {
      filter.status = status;
    }
    const offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);
    const totalOffers = await OfferModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limitNumber);
    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });
    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all offer by seller both
async function getAllOfferBySellerBoth(req, res) {
  try {
    const { page = 1, limit = 10, status, sellerId } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    const statusArray = typeof status === "string" ? status.split(",") : [];

    const filter = {
      sellerId: sellerId || undefined,
      ...(statusArray.length > 0 && { status: { $in: statusArray } }),
    };

    const offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);
    const totalOffers = await OfferModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limitNumber);
    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });
    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});
    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get one offer by both
async function getOneOfferByBoth(req, res) {
  try {
    const { jobId = "", sellerId = "" } = req.query;
    const filter = {};
    if (sellerId) filter.sellerId = sellerId;
    if (jobId) filter.jobId = jobId;
    const offer = await OfferModel.findOne(filter);
    if (!offer) {
      return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
    }

    const sellerData = await SellerModel.findById(offer.sellerId);
    const clientData = await ClientModel.findById(offer.clientId);
    const jobData = await JobModel.findById(offer.jobId);
    const detailedParticipation = {
      ...offer._doc,
      sellerData: sellerData || null,
      clientData: clientData || null,
      jobData: jobData || null,
    };

    res.status(200).json(detailedParticipation);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all offer by client
async function getAllOfferByClient(req, res) {
  try {
    const { clientId, page, limit, reviewSubmited, status } = req.query;
    const filter = {};
    if (clientId) {
      filter.clientId = clientId;
      filter.reviewSubmited = reviewSubmited;
    }
    if (status) {
      filter.status = status;
    }
    let offers,
      totalOffers,
      totalPages = 1;

    if (page && limit) {
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      offers = await OfferModel.find(filter).skip(skip).limit(limitNumber);
      totalOffers = await OfferModel.countDocuments(filter);
      totalPages = Math.ceil(totalOffers / limitNumber);
    } else {
      offers = await OfferModel.find(filter);
      totalOffers = offers.length;
    }

    const sellerIds = [...new Set(offers.map((p) => p.sellerId))];
    const clientIds = [...new Set(offers.map((p) => p.clientId))];
    const jobIds = [...new Set(offers.map((p) => p.jobId))];
    const sellers = await SellerModel.find({ _id: { $in: sellerIds } });
    const clients = await ClientModel.find({ _id: { $in: clientIds } });
    const jobs = await JobModel.find({ _id: { $in: jobIds } });

    const sellerDataMap = sellers.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const clientDataMap = clients.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const jobMap = jobs.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const detailedParticipations = offers.map((participation) => ({
      ...participation._doc,
      sellerData: sellerDataMap[participation.sellerId.toString()] || null,
      clientData: clientDataMap[participation.clientId.toString()] || null,
      jobData: jobMap[participation.jobId.toString()] || null,
    }));

    res.status(200).json({
      currentPage: page ? parseInt(page, 10) : 1,
      totalPages,
      totalOffers,
      offers: detailedParticipations,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// perticipation job
async function createPerticipation(req, res) {
  const { jobId, sellerId, bidMessage, jobCredit } = req.body;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const existJob = await JobModel.findOne({ _id: jobId });
  const email = existJob?.jobEmail;
  const existClient = await ClientModel.findOne({ email: email });
  const existoffer = await OfferModel.findOne({ jobId: jobId });
  const { credits, username } = existSeller || {};
  const { _id, firstname } = existClient || {};
  const { jobTitle, placeBid } = existJob || {};

  try {
    if (existoffer?.length >= 5) {
      return res.status(400).json({ message: BID_NOT_ACCEPT_MESSAGE });
    }
    if (credits >= jobCredit) {
      const updateSellerCredit = {
        credits: credits - jobCredit,
      };
      const PerticipationData = new OfferModel({
        sellerId: sellerId,
        clientId: _id,
        jobId: jobId,
        bidMessage: bidMessage,
        status: "pending",
        view: "unseen",
      });
      const communicationData = new CommunicationModel({
        clientId: _id,
        jobId,
        sellerId,
        jobTitle: existJob?.jobTitle,
        view: "unseen",
        sellerMessage: bidMessage
          ? [
              {
                message: bidMessage,
                date: new Date(),
                time: new Date().getTime(),
              },
            ]
          : [],
      });
      const bid = placeBid > 0 ? placeBid + 1 : 1;
      const UpdateJob = {
        placeBid: bid,
      };
      await sendClientEmailNotification(
        firstname,
        email,
        `${YOU_HAVE_RECIVE_RESPONSE}: ${username}`,
        `${username} ${SEND_REQUEST_TO_JOB_RESPONSE}: ${jobTitle}. ${CHECK_DASHBOARD_TO_SEE_BID_RESPONSE}`,
        username
      );
      await communicationData.save();
      await PerticipationData.save();
      await SellerModel.findByIdAndUpdate(sellerId, updateSellerCredit, {
        new: true,
      });
      await JobModel.findByIdAndUpdate(jobId, UpdateJob, {
        new: true,
      });
      res.status(200).json({ message: PARTICIPATION_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: ENOUGH_CREDIT_REQUIRE_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// make request offer
async function makeOfferRequest(req, res) {
  const { jobId, sellerId, offerMessage } = req.body;
  const id = req.params.id;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const { email, username: sellerName } = existSeller || {};
  const existJob = await JobModel.findOne({ _id: jobId });
  const clientEmail = existJob?.jobEmail;
  const existClient = await ClientModel.findOne({ email: clientEmail });
  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });

  const { username: clientName } = existClient || {};

  const { jobTitle } = existJob || {};
  try {
    const requestData = {
      offerMessage,
      status: "request",
      offerRequested: true,
      offerRequestedNotify: true,
    };
    if (existCommunication) {
      let updateCommunication = {
        $push: {},
        offerRequest: true,
      };
      updateCommunication.$push.clientMessage = {
        message: `${ASK_TO_MAKE_PROPOSAL_RESPONSE}.\n ${
          offerMessage &&
          `<p style="font-weight: bold; color: #777; font-size: 18px">${MESSAGE_RESPONSE}: </p>${offerMessage}`
        }`,
        date: new Date(),
        time: new Date().getTime(),
      };
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateCommunication,
        { new: true }
      );

      await sendSellerEmailNotification(
        sellerName,
        email,
        `${clientName} ${SEND_OFFER_REQUEST_RESPONSE}`,
        `${clientName} ${ASK_TO_MAKE_OFFER_RESPONSE}: ${jobTitle}. ${LOGIN_TO_CHECK_OFFER_RESPONSE}. ${
          offerMessage &&
          `<p style="font-weight: bold; color: #777; font-size: 18px">${clientName} ${MESSAGE_RESPONSE}: </p>${offerMessage}`
        }`,
        clientName,
        jobTitle,
        jobId
      );
      await OfferModel.findByIdAndUpdate(id, requestData, { new: true });
    }
    res.status(200).json({ message: REQUEST_SEND_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send bid request
async function sendBidRequest(req, res) {
  const { offerPrice, priceUnit, offerNote, sellerId, jobId } = req.body;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const { username: sellerName } = existSeller || {};
  const existJob = await JobModel.findOne({ _id: jobId });
  const { jobTitle, jobEmail, offerRequest } = existJob || {};
  const existClient = await ClientModel.findOne({ email: jobEmail });
  const { email, username: clientName } = existClient || {};
  const existOffer = await OfferModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });

  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });

  try {
    if (!existOffer.offerRequested) {
      return res
        .status(400)
        .json({ message: NOT_ELIGABLE_TO_SEND_BID_RESPONSE });
    } else if (existOffer.offerPlaced) {
      return res.status(400).json({ message: ALREADY_SEND_BID_MESSAGE });
    } else {
      const file = req?.file?.filename;
      const basePath = `${req.protocol}://${req.get("host")}/uploads/`;
      const offerFiles = file ? `${basePath}${file}` : null;
      if (existCommunication) {
        const requestData = {
          offerPrice,
          priceUnit,
          offerNote,
          offerFiles: offerFiles,
          status: "submit",
          offerPlaced: true,
          offerPlacedNotify: true,
          offerRequestedNotify: false,
        };

        await sendBidEmail(
          clientName,
          email,
          `${sellerName} ${PLACE_A_BID_RESPONSE} ${jobTitle}`,
          sellerName,
          offerPrice,
          priceUnit,
          offerNote
        );

        let updateData = { $push: {} };
        updateData.$push.sellerMessage = {
          message: `${PRICE_UNIT_RESPONSE}: ${priceUnit}\n ${OFFER_PRICE_RESPONSE}: ${offerPrice}\n ${OFFER_NOTE_RESPONSE}: ${offerNote}${
            req.file
              ? `\n ${OFFER_FILE_RESPONSE}: <br> <a style="color: #777; font-weight: bold;" href="${offerFiles}" download>${DOWNLOAD_OFFER_FILE_RESPONSE}</a>`
              : ""
          }`,
          date: new Date(),
          time: new Date().getTime(),
        };
        const jobData = {
          offerRequest: offerRequest > 0 ? offerRequest + 1 : 1,
        };
        await CommunicationModel.findByIdAndUpdate(
          existCommunication?._id,
          updateData,
          { new: true }
        );
        await OfferModel.findByIdAndUpdate(existOffer?._id, requestData, {
          new: true,
        });
        await JobModel.findByIdAndUpdate(existJob?._id, jobData, {
          new: true,
        });
      }
    }
    res.status(200).json({ message: BID_SEND_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update offer request status
async function updateOfferRequest(req, res) {
  const { status, sellerId, jobId } = req.body;
  const id = req.params.id;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const existJob = await JobModel.findOne({ _id: jobId });
  const { jobTitle, jobEmail, rejectBid, _id, placeBid } = existJob || {};
  const existClient = await ClientModel.findOne({ email: jobEmail });
  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });
  const { username: sellerName, email: sellerEmail } = existSeller || {};
  const { username: clientName } = existClient || {};
  try {
    const acceptData = {
      status: "accept",
      offerAccepted: true,
      offerPlacedNotify: false,
    };
    const rejectData = {
      status: "reject",
      offerRejected: true,
      offerPlacedNotify: false,
      offerRequestedNotify: false,
    };
    const acceptJobData = {
      status: "close",
    };
    const rejectJobData = {
      rejectBid: rejectBid > 0 ? rejectBid + 1 : 1,
      placeBid: placeBid > 0 ? placeBid - 1 : 0,
    };
    if (status === "accept") {
      let updateData = { $push: {} };
      updateData.$push.clientMessage = {
        message: `${GOOD_NEWS_PROPOSAL_ACCEPT_RESPONSE}`,
        date: new Date(),
        time: new Date().getTime(),
      };
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateData,
        { new: true }
      );

      await sendSellerEmailNotification(
        sellerName,
        sellerEmail,
        `${clientName} ${ACCEPT_OFFER_IN_THIS_JOB_RESPONSE}: ${jobTitle}`,
        `${sellerName} ${YOU_HAVE_GOOD_NEWS_RESPONSE}. ${clientName} ${ACCEPT_OFFER_SUCCESS_RESPONSE}`,
        clientName,
        jobTitle,
        jobId
      );
      await JobModel.findByIdAndUpdate(jobId, acceptJobData, { new: true });
      await OfferModel.findByIdAndUpdate(id, acceptData, { new: true });
      const otherOffers = await OfferModel.find({
        jobId: jobId,
        _id: { $ne: id },
      });
      for (const offer of otherOffers) {
        const rejectSeller = await SellerModel.findById(offer.sellerId);
        const rejectCommunication = await CommunicationModel.findOne({
          jobId: jobId,
          sellerId: offer.sellerId,
        });

        await sendSellerEmailNotification(
          rejectSeller.username,
          rejectSeller.email,
          `${clientName} ${REJECT_OFFER_RESPONSE}`,
          `${SORRY_INFROM_RESPONSE} ${clientName} ${DID_NOT_ACCEPT_OFFER_RESPONSE}: ${jobTitle}. ${LOGIN_DASHBOARD_TO_SEE_DETAILS_RESPONSE}`,
          clientName,
          jobTitle,
          jobId
        );
        let rejectUpdateData = { $push: {} };
        rejectUpdateData.$push.clientMessage = {
          message: SORRY_TO_INFORM_OFFER_REJECT_RESPONSE,
          date: new Date(),
          time: new Date().getTime(),
        };
        await CommunicationModel.findByIdAndUpdate(
          rejectCommunication?._id,
          rejectUpdateData,
          { new: true }
        );
        const allrejectJobData = {
          rejectBid: rejectBid > 0 ? placeBid - 1 + rejectBid : placeBid - 1,
          placeBid: 1,
        };
        await OfferModel.findByIdAndUpdate(offer._id, rejectData, {
          new: true,
        });
        await JobModel.findByIdAndUpdate(offer.jobId, allrejectJobData, {
          new: true,
        });
      }
    } else {
      let updateData = { $push: {} };
      updateData.$push.clientMessage = {
        message: SORRY_TO_INFORM_OFFER_REJECT_RESPONSE,
        date: new Date(),
        time: new Date().getTime(),
      };
      await sendSellerEmailNotification(
        sellerName,
        sellerEmail,
        `${clientName} ${REJECT_OFFER_RESPONSE}`,
        `${SORRY_INFROM_RESPONSE} ${clientName} ${DID_NOT_ACCEPT_OFFER_RESPONSE}: ${jobTitle}. ${LOGIN_DASHBOARD_TO_SEE_DETAILS_RESPONSE}`,
        clientName,
        jobTitle,
        jobId
      );
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateData,
        { new: true }
      );
      await JobModel.findByIdAndUpdate(_id, rejectJobData, { new: true });
      await OfferModel.findByIdAndUpdate(id, rejectData, { new: true });
    }
    res.status(200).json({ message: `Offer ${status}` });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create Offer
async function createOffer(req, res) {
  const { jobId, sellerId, clientId, message, perticipationId } = req.body;
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const existClient = await ClientModel.findOne({ _id: clientId });
  const id = sellerId;
  try {
    const existOffer = await OfferModel.findOne({
      perticipationId: perticipationId,
    });
    const existJob = await JobModel.findOne({
      _id: jobId,
    });

    if (existOffer) {
      return res.status(400).json({ message: ALREADY_SEND_REQUEST_MESSAGE });
    }
    if (existSeller.credits < 2) {
      return res
        .status(400)
        .json({ message: SELLER_NOT_HAVE_ENOUGH_CREDIT_MESSAGE });
    }
    const existCommunication = await CommunicationModel.findOne({
      jobId: jobId,
      sellerId: sellerId,
    });
    if (existCommunication) {
      let updateCommunication = { $push: {} }; // Initialize $push as an object
      updateCommunication.$push.clientMessage = {
        message: `${ASK_TO_MAKE_PROPOSAL_RESPONSE}\n ${
          message &&
          `<p style="font-weight: bold; color: #777; font-size: 18px">${MESSAGE_RESPONSE}: </p>${message}`
        }`,
        date: new Date(),
        time: new Date().getTime(),
      };

      await sendSellerEmailNotification(
        existSeller.username,
        existSeller.email,
        `${YOU_HAVE_RECIVE_RESPONSE} ${existClient?.username}`,
        `${CLIENT_NAME_RESPONSE}: ${
          existClient?.username
        } <br> ${CLIENT_PHONE_RESPONSE}: ${
          existClient?.phone
        }<br> ${CLIENT_EMAIL_RESPONSE}: ${existClient?.email} <br> ${
          message && `${MESSAGE_RESPONSE}: ${message}`
        }`,
        existClient?.username,
        jobId,
        existJob.jobTitle
      );
      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateCommunication,
        { new: true }
      );
    }
    const OfferData = new OfferModel({
      jobId,
      sellerId,
      clientId,
      message,
      perticipationId,
      jobTitle: existJob?.jobTitle,
    });
    const updateData = {
      credits: existSeller.credits ? existSeller.credits - 2 : 0,
    };
    await SellerModel.findByIdAndUpdate(id, updateData, { new: true });
    await OfferData.save();
    res.status(200).json({ message: REQUEST_SEND_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send email when send offer
async function sendBidEmail(
  name,
  email,
  subject,
  receiveName,
  offerPrice,
  priceUnit,
  offerNote
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
      intro: `${GET_NEW_OFFER_RESPONSE} ${receiveName}:`,
      signature: SINGNATURE_RESPONSE,
      outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">${OFFER_PRICE_RESPONSE}: </strong>
          <p style="font-size: 14px; color: #555;">${offerPrice}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">${PRICE_UNIT_RESPONSE}: </strong>
          <p style="font-size: 14px; color: #555;">${priceUnit}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">${OFFER_NOTE_RESPONSE}: </strong>
          <p style="font-size: 14px; color: #555;">${offerNote}</p>
        </div>
        <p style="font-size: 14px; color: #777;">${LOGIN_TO_REPLY_MESSAGE_RESPONSE} klicken Sie hier: <a href="${corsUrl}/client-dashboard" style="font-weight: bold;">${client_dashboard}</a></p>
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

// update offer view
async function updateOfferView(req, res) {
  const { clientId, jobId } = req.body;
  try {
    const filter = {
      jobId: jobId,
      clientId: clientId,
    };
    const updateView = {
      view: "seen",
    };
    await OfferModel.updateMany(filter, updateView);
    res.status(200).json({
      message: COMMUNICATION_MARK_SEEN_MESSAGE,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update offer details
async function updateOfferDetails(req, res) {
  const { offerPrice, priceUnit, offerNote, status } = req.body;
  const id = req.params.id;
  const existOffer = await OfferModel.findOne({ _id: id });
  const { jobId, sellerId } = existOffer || {};
  const existSeller = await SellerModel.findOne({ _id: sellerId });
  const { username } = existSeller || {};
  const existJob = await JobModel.findOne({ _id: jobId });
  const { jobTitle, jobEmail } = existJob || {};
  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });

  try {
    const file = req?.file?.filename;
    const basePath = `${req.protocol}://${req.get("host")}/uploads/`;
    const offerFiles = file ? `${basePath}${file}` : null;
    const updateOffer = {
      offerPrice,
      priceUnit,
      offerNote,
      offerFiles: offerFiles,
      status: status && status,
    };
    if (existCommunication) {
      let updateData = { $push: {} };
      updateData.$push.sellerMessage = {
        message: `<strong>UPDATED:</strong>\n ${PRICE_UNIT_RESPONSE}: ${priceUnit}\n ${OFFER_PRICE_RESPONSE}: ${offerPrice}\n ${OFFER_NOTE_RESPONSE}: ${offerNote}${
          req.file
            ? `\n ${OFFER_FILE_RESPONSE}: <br> <a style="color: #777; font-weight: bold;" href="${offerFiles}" download>${DOWNLOAD_OFFER_FILE_RESPONSE}</a>`
            : ""
        }`,
        date: new Date(),
        time: new Date().getTime(),
      };

      await CommunicationModel.findByIdAndUpdate(
        existCommunication?._id,
        updateData,
        { new: true }
      );

      await updateBidEmail(
        username,
        jobEmail,
        `${username} ${UPDATE_THERE_BID_RESPONSE} ${jobTitle}`,
        username,
        offerPrice,
        priceUnit,
        offerNote
      );
    }
    await OfferModel.findByIdAndUpdate(id, updateOffer, { new: true });
    res.status(200).json({
      message: UPDATE_SUCCESS_MESSAGE,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update mail send
async function updateBidEmail(
  name,
  email,
  subject,
  receiveName,
  offerPrice,
  priceUnit,
  offerNote
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
      intro: `${RECIVE_UPDATE_OFFER_RESPONSE} ${receiveName}:`,
      signature: SINGNATURE_RESPONSE,
      outro: `
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">${OFFER_PRICE_RESPONSE}: </strong>
          <p style="font-size: 14px; color: #555;">${offerPrice}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">${PRICE_UNIT_RESPONSE}: </strong>
          <p style="font-size: 14px; color: #555;">${priceUnit}</p>
        </div>
        <div style="border-top: 1px solid #ddd; margin: 20px 0; padding-top: 10px; display: flex; gap: 5px">
          <strong style="font-size: 16px;">${OFFER_NOTE_RESPONSE}: </strong>
          <p style="font-size: 14px; color: #555;">${offerNote}</p>
        </div>
        <p style="font-size: 14px; color: #777;">${LOGIN_TO_REPLY_MESSAGE_RESPONSE}, klicken Sie hier: <a href="${corsUrl}/client-dashboard" style="font-weight: bold;">${client_dashboard}</a></p>
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

// offer review request
async function offerReviewRequest(req, res) {
  const { id } = req.params;
  try {
    let existOffer = await OfferModel.findOne({ _id: id });
    const { jobId, sellerId } = existOffer || {};
    const existSeller = await SellerModel.findOne({ _id: sellerId });
    const { username: sellerName } = existSeller || {};
    const existJob = await JobModel.findOne({ _id: jobId });
    const { jobTitle, jobEmail } = existJob || {};
    const existClient = await ClientModel.findOne({ email: jobEmail });
    const { username: clientName, email } = existClient || {};
    if (existOffer) {
      let updateData = {
        reviewRequest: true,
      };
      await OfferModel.findByIdAndUpdate(id, updateData, { new: true });
      await sendClientEmailNotification(
        clientName,
        email,
        `${sellerName} ${SEND_REVIEW_REQUEST_RESPONSE}`,
        `${sellerName} ${ASK_TO_ADD_REVIEW_RESPONSE}. ${LOGIN_DASHBOARD_TO_WRITE_REVIEW_RESPONSE}  <p style="font-weigth: bold; font-size: 14px; color: #555;">${JOB_TITLE_RESPONSE}: ${jobTitle}</p>`,
        sellerName
      );
      res.status(200).json({ message: REVIEW_REQUEST_SEND_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// offer archive request
async function offerArchiveRequest(req, res) {
  const { id } = req.params;
  try {
    let existProposal = await OfferModel.findOne({ _id: id });
    if (existProposal) {
      let updateData = {
        offerArchived: true,
      };
      await OfferModel.findByIdAndUpdate(id, updateData, { new: true });
      res.status(200).json({ message: OFFER_ARCHIVED_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send client email
async function sendClientEmailNotification(
  name,
  email,
  subject,
  message,
  receiveName
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
        <p style="font-size: 14px; color: #777;">${LOGIN_TO_REPLY_MESSAGE_RESPONSE}, klicken Sie hier: <a href="${corsUrl}/client-dashboard" style="font-weight: bold;">${client_dashboard}</a></p>
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
    subject: subject,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

// send seller email
async function sendSellerEmailNotification(
  name,
  email,
  subject,
  message,
  receiveName,
  jobTitle,
  jobId
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
        <p style="font-size: 14px; color: #777; font-weight: bold;">${LOGIN_TO_REPLY_MESSAGE_RESPONSE}, ${jobTitle}: <a style="font-weight: bold;" href="${corsUrl}/search-job/${jobId}">${SEE_JOBS_RESPONSE}</a></p>
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
    subject: subject,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

// delete offer
async function deleteOffer(req, res) {
  const { id } = req.params;
  const existOffer = await OfferModel.findById(id);
  const { sellerId, jobId } = existOffer || {};
  const existSeller = await SellerModel.findById(sellerId);
  const { email, username: sellerName } = existSeller || {};
  const existCommunication = await CommunicationModel.findOne({
    jobId: jobId,
    sellerId: sellerId,
  });
  const existJob = await JobModel.findOne({ _id: jobId });
  const { _id, placeBid, jobTitle } = existJob || {};
  try {
    await sendDeleteEmail(
      sellerName,
      email,
      `${OFFER_HAS_DELETE_RESPONSE}`,
      "Suisse Offerten Team",
      jobTitle,
      _id
    );
    const updateJob = {
      placeBid: placeBid > 0 ? placeBid - 1 : 0,
    };
    await JobModel.findByIdAndUpdate(_id, updateJob, { new: true });
    await CommunicationModel.findByIdAndDelete(existCommunication?._id);
    await OfferModel.findByIdAndDelete(id);
    res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send notification email
async function sendDeleteEmail(
  name,
  email,
  subject,
  receiveName,
  jobTitle,
  jobId
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
          <p style="font-size: 14px; color: #555;">${OFFER_VAILATION_ERROR_RESPONSE}</p>
        </div>
        <p style="font-size: 14px; color: #777; font-weigth: bold;">${HAVE_QUESTION_ASK_CONTACT_RESPONSE} ${jobTitle}: <a style="font-weight: bold;" href="${corsUrl}/search-job/${jobId}">${SEE_JOBS_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>
      `,
    },
  };
  emailTemplate.body.message = `${OFFER_VAILATION_ERROR_RESPONSE}`;
  const emailBody = mailGenerator.generate(emailTemplate);
  const mailOptions = {
    from: EMAIL,
    to: email,
    subject: subject,
    html: emailBody,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = {
  getAllOffer,
  createOffer,
  getOneOffer,
  getOneOfferByJobId,
  getAllOfferDefault,
  createPerticipation,
  makeOfferRequest,
  sendBidRequest,
  updateOfferRequest,
  updateOfferView,
  getAllOfferByClient,
  getOneOfferByBoth,
  getAllOfferBySeller,
  getAllOfferBySellerBoth,
  updateOfferDetails,
  offerReviewRequest,
  offerArchiveRequest,
  getAllOfferByAdmin,
  deleteOffer,
};

const ReviewModel = require("../models/review-model");
const SellerModel = require("../models/seller-model");
const JobModel = require("../models/job-model");
const OfferModel = require("../models/offer-model");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  REVIEW_ALREADY_SUBMIT_MESSAGE,
  REVIEW_SUBMIT_SUCCESS_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
  YOU_HAVE_ALREADY_LIKE_MESSAGE,
  LIKED_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  YOU_HAVE_GET_RESPONSE,
  START_REVIEW_FROM_RESPONSE,
  REVIEW_CREATOR_RESPONSE,
  REVIEW_RESPONSE,
  REVIEW_RATING_RESPONSE,
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  YOU_HAVE_RECIVE_RESPONSE,
  MESSAGE_RESPONSE,
  LOGIN_DASHBOARD_TO_SEE_REVIEW_RESPONSE,
  SINGNATURE_RESPONSE,
  OUTRO_RESPONSE,
} = require("../utils/email.response");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const supportMail = process.env.SUPPORT_MAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const corsUrl = process.env.CORS_URL;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// get all reviews default
async function getAllReviewsDefault(req, res) {
  try {
    const reviews = await ReviewModel.find();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all review by sellerId by admin
async function getAllReviewBySellerAdmin(req, res) {
  try {
    const { page = 1, limit = 20, sellerId, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (sellerId) {
      filter.sellerId = sellerId;
    }
    if (status) {
      filter.status = status;
    }
    const reviews = await ReviewModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const totalreviews = await ReviewModel.countDocuments(filter);
    const totalPages = Math.ceil(totalreviews / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalreviews,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all review by clientid by admin
async function getAllReviewByClientAdmin(req, res) {
  try {
    const { page = 1, limit = 20, clientId, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (clientId) {
      filter.clientId = clientId;
    }
    if (status) {
      filter.status = status;
    }
    const reviews = await ReviewModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const totalreviews = await ReviewModel.countDocuments(filter);
    const totalPages = Math.ceil(totalreviews / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalreviews,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all review
async function getAllReview(req, res) {
  try {
    const { page = 1, limit = 20, sellerId } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (sellerId) {
      filter.sellerId = sellerId;
    }

    const reviews = await ReviewModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const totalreviews = await ReviewModel.countDocuments(filter);
    const totalPages = Math.ceil(totalreviews / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalreviews,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all review by admin
async function getAllReviewByAdmin(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const reviews = await ReviewModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const totalreviews = await ReviewModel.countDocuments(filter);
    const totalPages = Math.ceil(totalreviews / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalreviews,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get user review
async function getUserReview(req, res) {
  try {
    const existReview = await ReviewModel.find({
      jobId: req.params.id,
    });
    if (existReview) {
      res.status(200).json(existReview);
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get single review
async function getsingleReview(req, res) {
  const id = req.params.id;
  try {
    const existReview = await ReviewModel.findOne({ _id: id });
    if (existReview) {
      res.status(200).json(existReview);
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create review
async function createReview(req, res) {
  const { clinetName, review, rating, jobId, sellerId, clientId, offerId } =
    req.body;
  const existJob = await JobModel.findOne({ _id: jobId });
  const existSeller = await SellerModel.findOne({ _id: sellerId });

  try {
    const existIsReview = await ReviewModel.findOne({ sellerId, jobId });
    if (existIsReview) {
      return res.status(400).json({ message: REVIEW_ALREADY_SUBMIT_MESSAGE });
    }
    const reviewData = new ReviewModel({
      clinetName,
      review,
      rating: Number(rating),
      jobId,
      jobTitle: existJob?.jobTitle,
      sellerId,
      clientId,
      jobCategory: existJob?.jobCategoryCode,
      status: "pending",
      sellerName: existSeller?.username,
    });

    const existReview = await ReviewModel.find({ sellerId });
    const sumOfRating = existReview.reduce(
      (acc, item) => acc + (item.rating || 0),
      0
    );
    const totalReviews = existReview.filter(
      (item) => item.rating !== undefined && item.rating !== null
    ).length;
    const totalRating = totalReviews > 0 ? sumOfRating / totalReviews : 0;
    const percentageRating = totalReviews > 0 ? (totalRating / 5) * 100 : 0;

    const updateSeller = {
      reviewRating: totalRating,
      totalReview: totalReviews,
      reviewPercent: percentageRating,
    };
    await sendEmailNotification(
      existSeller.username,
      existSeller.email,
      `${YOU_HAVE_GET_RESPONSE} ${rating} ${START_REVIEW_FROM_RESPONSE} ${clinetName}`,
      `${REVIEW_CREATOR_RESPONSE}: ${clinetName}<br> ${REVIEW_RESPONSE}: ${review} <br> ${REVIEW_RATING_RESPONSE}: ${rating}`,
      clinetName,
      existJob?.jobTitle,
      jobId
    );
    const updateStatus = {
      reviewSubmited: "complete",
    };
    await reviewData.save();
    await SellerModel.findByIdAndUpdate(sellerId, updateSeller, { new: true });
    await OfferModel.findByIdAndUpdate(offerId, updateStatus, { new: true });
    res.status(200).json({ message: REVIEW_SUBMIT_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send email notification
async function sendEmailNotification(
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
        <p style="font-size: 14px; color: #777; font-weight: bold;">${LOGIN_DASHBOARD_TO_SEE_REVIEW_RESPONSE}, ${jobTitle}: <a style="font-weight: bold;" href="${corsUrl}/search-job/${jobId}">${corsUrl}/search-job/${jobId}</a></p>
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

// update review
async function updateReview(req, res) {
  const id = req.params.id;
  const { review, rating } = req.body;
  const reviewData = {
    review: review,
    rating: rating,
  };
  let existReview = await ReviewModel.findOne({ _id: id });
  try {
    if (existReview) {
      await ReviewModel.findByIdAndUpdate(id, reviewData, {
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

// update review status
async function updateReviewStatus(req, res) {
  const { id, status } = req.body;

  let existReview = await ReviewModel.findOne({ _id: id });
  try {
    if (existReview) {
      const reviewData = {
        status,
      };
      await ReviewModel.findByIdAndUpdate(id, reviewData, {
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

// delete review
async function deleteReview(req, res) {
  const id = req.params.id;
  let existReview = await ReviewModel.findOne({ _id: id });
  try {
    if (existReview) {
      await ReviewModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update review useful
async function updateReviewUseful(req, res) {
  const id = req.params.id;
  const { clientId } = req.body;
  let existReview = await ReviewModel.findOne({ _id: id });
  const existUseful = existReview?.useful?.find(
    (item) => item.usefulId === clientId
  );
  if (existUseful?.usefulId) {
    return res.status(400).json({ message: YOU_HAVE_ALREADY_LIKE_MESSAGE });
  }
  try {
    if (existReview) {
      const reviewData = {
        useful: [
          ...existReview.useful,
          {
            useful: 1,
            usefulId: clientId,
          },
        ],
      };
      await ReviewModel.findByIdAndUpdate(id, reviewData, {
        new: true,
      });
      res.status(200).json({ message: LIKED_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

module.exports = {
  getAllReview,
  getUserReview,
  getsingleReview,
  createReview,
  updateReview,
  deleteReview,
  updateReviewUseful,
  getAllReviewByAdmin,
  updateReviewStatus,
  getAllReviewsDefault,
  getAllReviewBySellerAdmin,
  getAllReviewByClientAdmin,
};

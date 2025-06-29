const JobModel = require("../models/job-model");
const ClientModel = require("../models/client-model");
const SellerModel = require("../models/seller-model");
const VerifyModel = require("../models/verify-model");
const WishlistModel = require("../models/wishlist-model");
const OfferModel = require("../models/offer-model");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const OTPModel = require("../models/otp-model");
const bcrypt = require("bcrypt");
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  EMAIL_ALREADY_EXIST_MESSAGE,
  USERNAME_ALREADY_EXIST_MESSAGE,
  JOB_PENDING_VERIFY_REQUIRE_MESSAGE,
  JOB_CREATE_SUCCESS_MESSAGE,
  OTP_SEND_SUCCESS_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");
const {
  NAME_RESPONSE,
  DOMAIN_URL_RESPONSE,
  NEW_JOB_POSTED_RESPONSE,
  JOB_TITLE_RESPONSE,
  JOB_DESCRIPTION_RESPONSE,
  JOB_LOCATION_RESPONSE,
  JOB_NUMBER_RESPONSE,
  VISIT_TO_SEE_JOB_RESPONSE,
  SEE_JOBS_RESPONSE,
  USE_VERIFICATION_CODE_TO_VERIFY_EMAIL_RESPONSE,
  IGNORE_EMAIL_RESPONSE,
  EMAIL_VERIFICATION_CODE_RESPONSE,
  YOUR_OTP_RESPONSE,
  GET_VERIFICATION_CODE_RESPONSE,
  OUTRO_RESPONSE,
  SINGNATURE_RESPONSE,
} = require("../utils/email.response");
const supportMail = process.env.SUPPORT_MAIL;
const corsUrl = process.env.CORS_URL;
const SMTP = process.env.EMAIL_SERVER_KEY;
const PORT = process.env.EMAIL_SERVER_PORT;

// get all jobs
async function getAllJob(req, res) {
  try {
    const { page, limit, category = "", location = "" } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = { status: "active" };
    if (category) {
      filter.jobCategoryId = Number(category);
    }
    if (location) {
      filter.jobCity = location;
    }
    const jobs = await JobModel.find(filter).skip(skip).limit(limitNumber);
    const totalJobs = await JobModel.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalJobs,
      jobs,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all jobs by admin
async function getAllJobByAdmin(req, res) {
  try {
    const { page, limit, search = "", status = "" } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (search) {
      filter.jobNumber = search;
    }
    if (status) {
      filter.status = status;
    }
    const jobs = await JobModel.find(filter).skip(skip).limit(limitNumber);
    const totalJobs = await JobModel.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalJobs,
      jobs,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all jobs by default
async function getAllJobDefault(req, res) {
  try {
    const jobs = await JobModel.find();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get jobs by category
async function getJobsByCategory(req, res) {
  const { category, page, limit } = req.query;
  const skip = (page - 1) * limit;
  try {
    const query = category ? { jobCategoryCode: category } : {};
    const jobs = await JobModel.find(query).skip(skip).limit(Number(limit));
    const totalItems = await JobModel.countDocuments(query);
    res.status(200).json({ jobs, totalItems });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all jobs by client
async function getAllJobByClient(req, res) {
  try {
    const { page, limit, email, status } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (email) {
      filter.jobEmail = email;
    }
    if (status) {
      filter.status = status;
    }
    const jobs = await JobModel.find(filter).skip(skip).limit(limitNumber);
    const totalJobs = await JobModel.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalJobs,
      jobs,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all jobs by seller
async function getAllJobBySeller(req, res) {
  try {
    const { page, limit, id, category = "", location = "" } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNumber - 1) * limitNumber;
    const existSeller = await SellerModel.findOne({ _id: id });
    if (!existSeller) {
      return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
    const { preference: locations = [], activities = [] } = existSeller;
    if (locations.length === 0 || activities.length === 0) {
      return res.status(200).json({
        currentPage: pageNumber,
        totalPages: 0,
        totalJobs: 0,
        jobs: [],
      });
    }
    const filter = {
      $and: [
        { jobCity: { $in: locations } },
        { jobSubCategories: { $in: activities } },
      ],
      status: "active",
    };
    if (category) {
      filter.jobCategoryCode = category;
    }
    if (location) {
      filter.jobCity = location;
    }
    const jobs = await JobModel.find(filter).skip(skip).limit(limitNumber);
    const totalJobs = await JobModel.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limitNumber);

    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalJobs,
      jobs,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get one jobs
async function getOneJob(req, res) {
  const id = req.params.id;
  try {
    const offer = await JobModel.findOne({ _id: id });
    if (offer) {
      return res.status(200).json(offer);
    } else {
      return res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create jobs
async function createJob(req, res) {
  const {
    jobTitle,
    jobDescription,
    jobCategoryCode,
    jobQuestions,
    jobPostcode,
    jobLocation,
    jobSiteVisitPossible,
    jobCompletionDate,
    jobEmail,
    clinetId,
    jobCity,
    username,
    password,
    jobSubCategories,
    credits,
    firstname,
    lastname,
    phone,
    jobCategoryId,
  } = req.body;
  try {
    let email;
    let jobUsername;
    let countJob;
    let clientEmail = await ClientModel.findOne({ email: jobEmail });
    let clientUsername = await ClientModel.findOne({ username: username });
    let sellerEmail = await SellerModel.findOne({ email: jobEmail });
    let sellerUsername = await SellerModel.findOne({ username: username });
    const matchingSellers = await SellerModel.find({
      $and: [
        { preference: { $in: jobCity } },
        { activities: { $in: jobSubCategories.split(",") } },
      ],
    });

    if (clientEmail) {
      return res.status(400).json({ message: EMAIL_ALREADY_EXIST_MESSAGE });
    }
    if (clientUsername) {
      return res.status(400).json({ message: USERNAME_ALREADY_EXIST_MESSAGE });
    }
    if (sellerEmail) {
      return res.status(400).json({ message: EMAIL_ALREADY_EXIST_MESSAGE });
    }
    if (sellerUsername) {
      return res.status(400).json({ message: USERNAME_ALREADY_EXIST_MESSAGE });
    }
    if (jobEmail) {
      email = jobEmail;
      jobUsername = username;
      countJob = jobEmail.createdJobs;
    } else {
      let clientEmail = await ClientModel.findOne({ _id: clinetId });
      email = clientEmail.email;
      countJob = clientEmail.createdJobs;
      jobUsername = clientEmail.username;
    }
    let file = [];
    const basePath = `${req.protocol}://${req.get("host")}/uploads/`;
    for (let i = 0; i < req.files.length; i++) {
      const savedFileName = req.files[i].filename;
      file.push(`${basePath}${savedFileName}`);
    }
    const generatedNumbers = new Set();
    const generateNum = (min, max) => {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * (max - min + 10)) + min;
      } while (generatedNumbers.has(randomNumber));
      generatedNumbers.add(randomNumber);
      return randomNumber;
    };

    const uniqueNumber = generateNum(100000, 10000000);
    const sellerEmails = matchingSellers.map((seller) => seller.email);
    const sellerNames = matchingSellers.map((seller) => seller.username);

    const job = new JobModel({
      jobTitle,
      jobCity,
      jobDescription,
      jobCategoryCode,
      jobQuestions,
      jobPostcode,
      jobLocation,
      jobSiteVisitPossible,
      jobCompletionDate,
      jobFiles: file,
      jobEmail: email,
      jobNumber: uniqueNumber,
      requireCredit: 2,
      jobUsername: jobUsername,
      jobSubCategories: jobSubCategories.split(","),
      status: clinetId ? "active" : "pending",
      credits,
      jobCategoryId,
    });
    await job.save();

    if (!clinetId) {
      bcrypt.hash(password, 10, async function (err, hash) {
        const client = new ClientModel({
          username,
          email: email,
          password: hash,
          firstname,
          lastname,
          phone,
          createdJobs: countJob > 0 ? countJob + 1 : 0,
        });
        await client.save();
        res.status(201).json({
          message: JOB_PENDING_VERIFY_REQUIRE_MESSAGE,
        });
        await sendVerificationCode(username, email);
      });
    } else {
      res.status(201).json({ message: JOB_CREATE_SUCCESS_MESSAGE });
    }
    if (sellerEmails.length > 0 && clinetId) {
      await sendJobEmails(
        sellerEmails,
        jobTitle,
        jobDescription,
        jobLocation,
        uniqueNumber,
        sellerNames
      );
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// send email to all exist seller
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
  const existJob = await JobModel.findOne({ jobNumber: uniqueNumber });
  const id = existJob?._id;
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
        <p style="font-size: 14px; color: #777;">${VISIT_TO_SEE_JOB_RESPONSE} <a href="${corsUrl}/search-job/${id}">${SEE_JOBS_RESPONSE}</a></p>
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

// send client verification code
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
      intro: USE_VERIFICATION_CODE_TO_VERIFY_EMAIL_RESPONSE,
      signature: SINGNATURE_RESPONSE,
      table: {
        data: [
          {
            "Your Verification Code": verificationCode,
          },
        ],
      },
      outro: `<p style="font-size: 14px; color: #777;">${IGNORE_EMAIL_RESPONSE}</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>`,
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

// check client email on database
async function CheckClient(req, res) {
  const { email } = req.body;
  try {
    const existClient = await ClientModel.findOne({ email: email });
    if (existClient) {
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
          name: existClient?.email,
          intro: "Suisse-Offerten OTP",
          signature: SINGNATURE_RESPONSE,
          table: {
            data: [
              {
                Message: `${YOUR_OTP_RESPONSE}: ${otp}`,
              },
            ],
          },
          outro: `<p style="font-size: 14px; color: #777;">${GET_VERIFICATION_CODE_RESPONSE}</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>`,
        },
      };
      let mail = await mailGenarator.generate(response);
      let message = {
        from: EMAIL,
        to: req.body.email,
        subject: `Suisse-Offerten OTP: ${otp}`,
        html: mail,
      };
      transport.sendMail(message).then(() => {
        return res
          .status(200)
          .json({ email: email, message: OTP_SEND_SUCCESS_MESSAGE });
      });
    } else {
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
          name: existClient?.email,
          intro: "Suisse-Offerten OTP",
          signature: SINGNATURE_RESPONSE,
          table: {
            data: [
              {
                Message: `${YOUR_OTP_RESPONSE}: ${otp}`,
              },
            ],
          },
          outro: `<p style="font-size: 14px; color: #777;">${GET_VERIFICATION_CODE_RESPONSE}</p>
        <p style="font-size: 14px; color: #4285F4;"><a href="${corsUrl}">${NAME_RESPONSE}</a></p>
        <p style="font-size: 14px; color: #4285F4;">E-mail: ${supportMail}</p>`,
        },
      };
      let mail = await mailGenarator.generate(response);
      let message = {
        from: EMAIL,
        to: req.body.email,
        subject: `Suisse-Offerten OTP: ${otp}`,
        html: mail,
      };
      transport.sendMail(message).then(() => {
        return res
          .status(200)
          .json({ email: email, message: OTP_SEND_SUCCESS_MESSAGE });
      });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update jobs
async function updateJob(req, res) {
  const id = req.params.id;
  const {
    jobTitle,
    jobDescription,
    jobPostcode,
    jobLocation,
    jobSiteVisitPossible,
    jobCompletionDate,
    jobCity,
    status,
  } = req.body;
  try {
    let file = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        file.push(req.files[i].location);
      }
    }
    const updateOffer = {
      jobTitle,
      jobDescription,
      jobPostcode,
      jobLocation,
      jobSiteVisitPossible,
      jobCompletionDate,
      jobCity,
      jobImage: file,
      status,
    };
    await JobModel.findByIdAndUpdate(id, updateOffer, {
      new: true,
    });
    res.status(201).json({ message: UPDATE_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// delete jobs
async function deleteJob(req, res) {
  const id = req.params.id;
  let existEvent = await JobModel.findOne({ _id: id });
  try {
    if (existEvent) {
      await JobModel.findByIdAndDelete(id);
      await WishlistModel.deleteMany({ jobId: id });
      await OfferModel.deleteMany({ jobId: id });
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// filter jobs
async function filterJob(req, res) {
  const { jobsCategory } = req.body;
  const jobs = await JobModel.find();
  const filterData = jobs.filter((item) =>
    jobsCategory.includes(item?.category)
  );
  try {
    res.status(200).json(filterData);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update job status
async function updateJobStatus(req, res) {
  const { status } = req.body;
  const id = req.params.id;
  const existJob = await JobModel.findOne({ _id: id });
  try {
    if (existJob) {
      const updateStatus = {
        status: status,
      };
      await JobModel.findByIdAndUpdate(id, updateStatus, { new: true });
      res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

module.exports = {
  getAllJob,
  getOneJob,
  createJob,
  updateJob,
  deleteJob,
  CheckClient,
  filterJob,
  getJobsByCategory,
  getAllJobByClient,
  getAllJobBySeller,
  getAllJobByAdmin,
  updateJobStatus,
  getAllJobDefault,
};

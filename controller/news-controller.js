const NewsModel = require("../models/news-model");
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  CREATE_NEWS_SUCCESS_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");

// get all news
async function getAllNews(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const news = await NewsModel.find().skip(skip).limit(limitNumber);
    const totalNews = await NewsModel.countDocuments();
    const totalPages = Math.ceil(totalNews / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalNews,
      news: news,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all news by admin
async function getAllNewsByAdmin(req, res) {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    const news = await NewsModel.find(filter).skip(skip).limit(limitNumber);
    const totalNews = await NewsModel.countDocuments(filter);
    const totalPages = Math.ceil(totalNews / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalNews,
      news: news,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get single news
async function getsingleNews(req, res) {
  const id = req.params.id;
  try {
    const exiistNews = await NewsModel.findOne({ _id: id });
    if (exiistNews) {
      res.status(200).json(exiistNews);
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create news
async function createNews(req, res) {
  const { nameOfStation, senderEmail, reference, news, sendName, status } =
    req.body;
  try {
    const newsData = new NewsModel({
      nameOfStation,
      senderEmail,
      reference,
      news,
      sendName,
      status,
    });

    await newsData.save();
    res.status(200).json({ message: CREATE_NEWS_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// update news
async function updateNews(req, res) {
  const id = req.params.id;
  const { nameOfStation, senderEmail, reference, news, status, sendName } =
    req.body;

  let exiistNews = await NewsModel.findOne({ _id: id });
  try {
    if (exiistNews) {
      const newsData = {
        nameOfStation,
        senderEmail,
        reference,
        news,
        sendName,
        status,
      };
      await NewsModel.findByIdAndUpdate(id, newsData, {
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

// delete news
async function deleteNews(req, res) {
  const id = req.params.id;
  let exiistNews = await NewsModel.findOne({ _id: id });
  try {
    if (exiistNews) {
      await NewsModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

module.exports = {
  getAllNews,
  getsingleNews,
  createNews,
  updateNews,
  deleteNews,
  getAllNewsByAdmin,
};

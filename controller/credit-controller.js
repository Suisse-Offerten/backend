const CreditModel = require("../models/credit-model");
const SellerModel = require("../models/seller-model");
const {
  SERVER_ERROR_MESSAGE,
  CREDIT_CREATE_SUCCESS_MESSAGE,
  CREDIT_CANCEL_SUCCESS_MESSAGE,
  UPDATE_SUCCESS_MESSAGE,
  CREDIT_NOT_FOUND_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
} = require("../utils/response");

// get one Credit
const getOneCredit = async (req, res) => {
  const { id } = req.params;
  try {
    const credit = await CreditModel.findOne({ _id: id });
    res.status(200).json(credit);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error: error });
  }
};

// get all credit
async function getAllCredit(req, res) {
  try {
    const credits = await CreditModel.find();
    res.status(200).json(credits);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error: error });
  }
}

// get all Credit
async function getAllCreditByAdmin(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const credits = await CreditModel.find(filter)
      .skip(skip)
      .limit(limitNumber);
    const totalCredits = await CreditModel.countDocuments(filter);
    const totalPages = Math.ceil(totalCredits / limitNumber);
    res.status(200).json({
      currentPage: pageNumber,
      totalPages,
      totalCredits,
      credits,
    });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error: error });
  }
}

// create Credit
const createCredit = async (req, res) => {
  const { title, price, status, credits } = req.body;
  try {
    const createData = new CreditModel({
      title,
      price,
      status,
      credits,
    });
    await createData.save();
    res.status(200).json({ message: CREDIT_CREATE_SUCCESS_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error: error });
  }
};

// cancel Credit
const cancelCredit = async (req, res) => {
  const { id } = req.params;
  const existSeller = await SellerModel.findOne({ _id: id });
  try {
    if (existSeller) {
      const updateSeller = {
        memberShip: {},
        memberShipStatus: "not-available",
        credits: 0,
      };
      await SellerModel.findByIdAndUpdate(id, updateSeller, {
        new: true,
      });
      res.status(200).json({ message: CREDIT_CANCEL_SUCCESS_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error: error });
  }
};

// update Credit
const updateCredit = async (req, res) => {
  const { id } = req.params;
  const { title, price, status, credits } = req.body;
  try {
    const existCredit = await CreditModel.findOne({ _id: id });
    if (existCredit) {
      const updateData = {
        title,
        price,
        status,
        credits,
      };
      await CreditModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      res.status(200).json({ message: UPDATE_SUCCESS_MESSAGE });
    } else {
      res.status(200).json({ message: CREDIT_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error: error });
  }
};

// delete Credit
const deleteCredit = async (req, res) => {
  const { id } = req.params;
  const existCredit = await CreditModel.findOne({ _id: id });

  try {
    if (existCredit) {
      await CreditModel.findByIdAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(404).json({ message: CREDIT_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error: error });
  }
};

module.exports = {
  getOneCredit,
  getAllCredit,
  createCredit,
  updateCredit,
  deleteCredit,
  cancelCredit,
  getAllCreditByAdmin,
};

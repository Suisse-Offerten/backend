const PaymentModel = require("../models/payment-model");
const SellerModel = require("../models/seller-model");
const TransactionModel = require("../models/transaction-model");
const baseURL = process.env.CORS_URL;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  MEMBERSHIP_ALREADY_CREATE_MESSAGE,
  DELETE_SUCCESS_MESSAGE,
  INVALID_PLAN_MESSAGE,
} = require("../utils/response");
const priceMapping = {
  oneMonth: process.env.PRICING_ID_ONE,
  threeMonth: process.env.PRICING_ID_TOW,
  sixMonth: process.env.PRICING_ID_THREE,
  oneYear: process.env.PRICING_ID_FOUR,
};

// Get all payment
async function getAllPayment(req, res) {
  try {
    const data = await PaymentModel.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Get Single payment
async function getSinglePayment(req, res) {
  const id = req.params.id;
  const existMessage = await PaymentModel.findOne({ _id: id });
  try {
    if (!existMessage) {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    } else {
      res.status(200).json(existMessage);
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create membership payment
async function createMembershipPayment(req, res) {
  const { _id, currentPrice, plan } = req.body;
  const item = req.body;
  const { id } = req.params;
  const successUrl = `${baseURL}/seller-dashboard/payment-success`;
  const failedUrl = `${baseURL}/seller-dashboard/membership/buy`;
  try {
    const existSeller = await SellerModel.findOne({ _id: id });
    const { memberShip, username, email } = existSeller || {};
    if (item?.plan === "free-plan") {
      const updateMembership = {
        memberShip: item,
        credits: item?.credit,
        memberShipStatus: "complete",
      };

      await SellerModel.findByIdAndUpdate(id, updateMembership, { new: true });
      return res.status(200).json({ pageUrl: successUrl });
    }
    const priceId = priceMapping[plan];
    if (!priceId) {
      return res.status(404).json({ message: INVALID_PLAN_MESSAGE });
    }
    const existingCustomer = await stripe.customers.list({ email });
    let customer;
    if (existingCustomer.data.length > 0) {
      customer = existingCustomer.data[0];
    } else {
      customer = await stripe.customers.create({ email, name: username });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: failedUrl,
      metadata: { sellerId: id, planId: _id },
    });

    await TransactionModel.create({
      transactionId: session.id,
      sellerId: id,
      memberShip: req.body,
      cost: currentPrice,
      status: "pending",
    });
    if (memberShip?.credit > 0) {
      await SellerModel.findByIdAndUpdate(
        id,
        {
          extendCredit: item?.credit,
          extendTime: item?.planTime,
          extendMembership: item,
        },
        { new: true }
      );
    } else {
      await SellerModel.findByIdAndUpdate(
        id,
        { memberShipStatus: "not-complete" },
        { new: true }
      );
    }
    return res.status(200).json({ pageUrl: session.url });
  } catch (error) {
    return res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// create credit payment
async function createCreditsPayment(req, res) {
  const { id, credits, price, sellerId } = req.body;
  const successUrl = `${baseURL}/seller-dashboard/seller-credit/payment-success`;
  const failedUrl = `${baseURL}/seller-dashboard/seller-credit/payment-fail`;
  const existSeller = await SellerModel.findOne({ _id: sellerId });

  const { username, email } = existSeller || {};
  try {
    const existingCustomer = await stripe.customers.list({ email });
    let customer;
    if (existingCustomer.data.length > 0) {
      customer = existingCustomer.data[0];
    } else {
      customer = await stripe.customers.create({ email, name: username });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "twint"],
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "CHF",
            product_data: {
              name: `${credits} Credit`,
              description: `You are purchasing ${credits} Credits for CHF ${price}.`,
            },
            unit_amount: price * 100, // Ensure price is in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      invoice_creation: { enabled: true },
      success_url: successUrl,
      cancel_url: failedUrl,
      metadata: {
        sellerId: sellerId,
        creditId: id,
        additional_info: `Purchase of ${credits} credits`,
      },
    });
    await TransactionModel.create({
      transactionId: session.id,
      sellerId: sellerId,
      memberShip: req.body,
      cost: price,
      status: "pending",
    });
    await SellerModel.findByIdAndUpdate(
      sellerId,
      { pendingCredits: credits },
      { new: true }
    );
    return res.status(200).json({ pageUrl: session.url });
  } catch (error) {
    return res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// Delete payment
async function deletePayment(req, res) {
  const id = req.params.id;
  let existMessage = await PaymentModel.findOne({ _id: id });
  try {
    if (existMessage) {
      await PaymentModel.findOneAndDelete(id);
      res.status(200).json({ message: DELETE_SUCCESS_MESSAGE });
    } else {
      res.status(400).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// get all transaction
async function getAllTransactions(req, res) {
  try {
    let existtransac = await TransactionModel.find();
    res.status(200).json(existtransac);
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

module.exports = {
  createMembershipPayment,
  getAllPayment,
  getSinglePayment,
  deletePayment,
  createCreditsPayment,
  getAllTransactions,
};

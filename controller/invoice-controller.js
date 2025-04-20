const {
  SERVER_ERROR_MESSAGE,
  DATA_NOT_FOUND_MESSAGE,
  QUERY_SUCCESS_FULL_MESSAGE,
} = require("../utils/response");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// get ALl invoice
async function getAllInvoice(req, res) {
  const { limit = 20, email } = req.query;
  const limitNumber = parseInt(limit);
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });
    let invoices;
    if (customers?.data?.length === 0) {
      invoices = [];
    } else {
      const customerId = customers.data[0].id;
      invoices = await stripe.invoices.list({
        customer: customerId,
        limit: limitNumber,
      });
    }
    res
      .status(200)
      .json({ message: QUERY_SUCCESS_FULL_MESSAGE, invoices: invoices });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

// download invoice
async function downloadInvoice(req, res) {
  try {
    const { id } = req.params;
    const invoice = await stripe.invoices.retrieve(id);
    if (!invoice.invoice_pdf) {
      return res.status(404).json({ message: DATA_NOT_FOUND_MESSAGE });
    }
    const invoicePdfUrl = invoice.invoice_pdf;
    res.status(200).json({ pageURL: invoicePdfUrl });
  } catch (error) {
    res.status(500).json({ message: SERVER_ERROR_MESSAGE, error });
  }
}

module.exports = { getAllInvoice, downloadInvoice };

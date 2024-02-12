const asyncHandler = require("express-async-handler");
const Bill = require("../models/billModel");
const Quotation = require("../models/quotationModel");
const Challan = require("../models/challanModel");
const Transaction = require("../models/transactionModel");

const User = require("../models/userModel");

const { isValidObjectId } = require("mongoose");
const { getDuesData, getBillsData } = require("./billController");
const { getChallansData } = require("./challanController");
const { getQuotation, getQuotationsData } = require("./quotationsController");
const { getTransactionsData } = require("./transactionController");

const ObjectId = require("mongodb").ObjectId;

// @desc: GET DUEs of bills
// @route: GET /api/bill/:id
// @access: private

const getDashboard = asyncHandler(async (req, res) => {
  /*
    isDistinct - true||false
    */
  const { userId, isDistinct, ignoreBill, alreadyAdded } = req.query;
  const filter = {};

  //   dues
  let getDues = await getDuesData(req, res);
  let getBills = await getBillsData(req, res);
  let getChallans = await getChallansData(req, res);
  let getQuotations = await getQuotationsData(req, res);
  let getTransaction = await getTransactionsData(req, res);

  //   if(getDuesData?.status){
  //     getDuesData = {totalAmount: getDuesData?.}
  //   }

  res.status(200).json({
    status: true,
    message: "Get Dashboard Successfully",
    // test: dues,
    dashboard: {
      transactions: getTransaction,
      dues: getDues,
      bills: getBills,
      challans: getChallans,
      quotations: getQuotations,
    },
  });
});

module.exports = {
  getDashboard,
};

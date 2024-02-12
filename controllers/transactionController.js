const asyncHandler = require("express-async-handler");
const { incrementByOneCounterByType } = require("./counterController");
const moment = require("moment/moment");
const { isValidObjectId } = require("mongoose");
const { payBillByTransaction } = require("./helpers/helpersForBill");
const ObjectId = require("mongodb").ObjectId;
const Transaction = require("../models/transactionModel");

const getTransactions = asyncHandler(async (req, res) => {
  const { searchKey, startDate, endDate, sortBy, userId } = req.query;

  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided

  const pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 documents per page

  // Calculate the number of documents to skip based on the current page and pageSize
  const skipDocuments = (page - 1) * pageSize;

  let filters = {};

  if (startDate && endDate) {
    filters.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (searchKey) {
    filters.$or = [
      { transactionId: { $regex: new RegExp(searchKey, "i") } }, // Case-insensitive search
    ];

    filters.$or = !isNaN(parseInt(searchKey, 10))
      ? [...filters.$or, { payment: parseInt(searchKey, 10) }]
      : [...filters.$or];
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Transaction.find(filters)
    .sort({
      createdAt: sortBy === "asc" ? 1 : -1,
    })
    .populate("user")
    .exec();

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginatedTransaction = filteredData?.slice(
    skipDocuments,
    skipDocuments + pageSize
  );

  res.status(200).json({
    status: true,
    message: `Transaction found successfully`,
    transactions: paginatedTransaction,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  });
});

const getTransactionsData = asyncHandler(async (req, res) => {
  const { searchKey, startDate, endDate, sortBy, userId } = req.query;

  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided

  const pageSize = parseInt(req.query.pageSize) || 0; // Default to 10 documents per page

  // Calculate the number of documents to skip based on the current page and pageSize
  const skipDocuments = (page - 1) * pageSize;

  let filters = {};

  if (startDate && endDate) {
    filters.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (searchKey) {
    filters.$or = [
      { transactionId: { $regex: new RegExp(searchKey, "i") } }, // Case-insensitive search
    ];

    filters.$or = !isNaN(parseInt(searchKey, 10))
      ? [...filters.$or, { payment: parseInt(searchKey, 10) }]
      : [...filters.$or];
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Transaction.find(filters)
    .sort({
      createdAt: sortBy === "asc" ? 1 : -1,
    })
    .populate("user")
    .exec();

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

  const paginatedTransaction =
    pageSize > 0
      ? filteredData?.slice(skipDocuments, skipDocuments + pageSize)
      : filteredData;

  let totalPayment = 0;
  paginatedTransaction.forEach((trx) => {
    totalPayment += trx?.payment;
  });

  return {
    totalPayment: totalPayment,
    totalTransaction: totalCount,
    transactions: paginatedTransaction,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  };
});

const makeTransaction = asyncHandler(async (req, res) => {
  const { user, payment, type = "payment" } = req.body;

  const getCounter = await incrementByOneCounterByType("transaction");

  // const transactionId = `AFF${moment(new Date()).format("DDMMYYYY")}${
  //   getCounter?.counter?.counter
  // }`;

  // const createTransaction = await Transaction.create({
  //   user: new ObjectId(user),
  //   payment,
  //   type,
  //   transactionId,
  // });

  const updatedBill = await payBillByTransaction(user, payment);

  res.status(200).json({
    status: true,
    message: "Transaction Created Successfully",
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const existingTransaction = await Transaction.findById(req.params.id);

  if (!existingTransaction) {
    res.status(400);
    res.json({ status: false, message: "Transaction not found." });
  }

  await existingTransaction.deleteOne();

  res.status(200).json({
    status: true,
    message: "Transaction deleted successfully",
    transaction: existingTransaction,
  });
});

const deleteTransactionGlobal = asyncHandler(async (trxId) => {
  const existingTransaction = await Transaction.findById(trxId);

  if (!existingTransaction) {
    return false;
  }

  await existingTransaction.deleteOne();

  return true;
});

module.exports = {
  makeTransaction,
  getTransactions,
  deleteTransaction,
  getTransactionsData,
  deleteTransactionGlobal,
};

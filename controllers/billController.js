const asyncHandler = require("express-async-handler");
const Bill = require("../models/billModel");
const { incrementByOneCounterByType } = require("./counterController");
const User = require("../models/userModel");
const moment = require("moment/moment");
const { isValidObjectId } = require("mongoose");
const {
  addAndRemoveBillHandler,
  populateBills,
} = require("./helpers/helpersForBill");
const {
  makePaymentAdvanceWithPayment,
} = require("./helpers/helpersForTransaction");
const { deleteTransactionGlobal } = require("./transactionController");
const ObjectId = require("mongodb").ObjectId;

// @desc: get bill
// @route: GET /api/bill/:id
// @access: private

const getBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate("user");
  // .populate("dues")
  // .exec(); // Populate the "duesArray" field with corresponding "Bill" objects

  if (!bill) {
    res
      .status(200)
      .json({ status: false, message: `Bill not found`, bill: {} });
  }

  const populatedBill = await populateBills(bill?.dues);

  res.status(200).json({
    status: true,
    message: `Bill found successfully`,
    bill: { ...bill?._doc, dues: populatedBill },
  });
});

// @desc: get bill
// @route: GET /api/bill
// query: startDate,endDate: 2023-08-01, sortBy: asc,dsc, searchKey
// @access: private
const getBills = asyncHandler(async (req, res) => {
  // @data filter key
  const { searchKey, startDate, endDate, sortBy, userId } = req.query;

  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided

  const pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 documents per page

  // Calculate the number of documents to skip based on the current page and pageSize
  const skipDocuments = (page - 1) * pageSize;

  let filters = {};

  if (startDate && endDate) {
    filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (searchKey) {
    filters.$or = [
      { "bills.desc": { $regex: new RegExp(searchKey, "i") } }, // Case-insensitive search
    ];

    filters.$or = !isNaN(parseInt(searchKey, 10))
      ? [
          ...filters.$or,
          { billNo: parseInt(searchKey, 10) },
          { payment: parseInt(searchKey, 10) },
          { advance: parseInt(searchKey, 10) },
          { totalAmount: parseInt(searchKey, 10) },
        ]
      : [...filters.$or];
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Bill.find(filters)
    .sort({
      billNo: sortBy === "asc" ? 1 : -1,
    })
    .populate("user")
    .populate("dues")
    .exec();
  // .limit(pageSize)
  // .skip(skipDocuments)
  // .exec();

  const convertedFilteredData = filteredData.map((bill) => {
    const updatedDues = bill?.dues?.map((dueBill) => {
      const totalDue =
        dueBill?.totalAmount - dueBill?.advance - dueBill?.payment;

      return { ...dueBill?._doc, due: totalDue };
    });

    return { ...bill?._doc, dues: updatedDues };
  });

  const totalCount = convertedFilteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginatedbills = convertedFilteredData?.slice(
    skipDocuments,
    skipDocuments + pageSize
  );

  res.status(200).json({
    status: true,
    message: `Bills found successfully`,
    bills: paginatedbills,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  });
});

const getBillsData = asyncHandler(async (req, res) => {
  // @data filter key
  const { searchKey, startDate, endDate, sortBy, userId } = req.query;

  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided

  const pageSize = parseInt(req.query.pageSize) || 0; // Default to 10 documents per page

  // Calculate the number of documents to skip based on the current page and pageSize
  const skipDocuments = (page - 1) * pageSize;

  let filters = {};

  if (startDate && endDate) {
    filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (searchKey) {
    filters["bills.desc"] = { $regex: new RegExp(searchKey, "i") };
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Bill.find(filters)
    .sort({
      billNo: sortBy === "asc" ? 1 : -1,
    })
    .populate("user")
    .populate("dues")
    .exec();
  // .limit(pageSize)
  // .skip(skipDocuments)
  // .exec();

  const convertedFilteredData = filteredData.map((bill) => {
    const updatedDues = bill?.dues?.map((dueBill) => {
      const totalDue =
        dueBill?.totalAmount - dueBill?.advance - dueBill?.payment;

      return { ...dueBill?._doc, due: totalDue };
    });

    return { ...bill?._doc, dues: updatedDues };
  });

  const totalCount = convertedFilteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

  const paginatedbills =
    pageSize > 0
      ? convertedFilteredData?.slice(skipDocuments, skipDocuments + pageSize)
      : convertedFilteredData;

  return {
    bills: paginatedbills,
    totalBills: totalCount,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  };
});

// @desc: add bill
// @route: POST /api/bill/:id
// @access: private
const addBill = asyncHandler(async (req, res) => {
  const {
    user,
    bills,
    advance,
    prevAdvance,
    due,
    dues,
    totalAmount,
    isFullPaid,
    isDistinct,
    payment,
    date,
  } = req.body;

  const dateString = date;
  const format = "DD/MM/YYYY";

  if (user || !bills?.length || !date) {
    res.status(400);
  }

  const existingUser = await User.findById(req?.body?.user);

  if (!existingUser) {
    res.status(400);
    res.json({ status: false, message: "User not found" });
  }

  const getCounter = await incrementByOneCounterByType("bill");

  const objectIdDues = dues?.length > 0 ? dues : [];

  const storedData = await addAndRemoveBillHandler([], dues);

  const populatedBill = await populateBills(objectIdDues);

  let advanceTrx;
  let paymentTrx;

  if (advance > 0)
    advanceTrx = await makePaymentAdvanceWithPayment(
      user,
      "advance",
      advance,
      "newTnx"
    );
  if (payment > 0)
    paymentTrx = await makePaymentAdvanceWithPayment(
      user,
      "payment",
      payment,
      "newTnx"
    );

  console.log("advanceTrx paymentTrx", advanceTrx, "paymentTrx", paymentTrx);

  if (advanceTrx?.status === false || paymentTrx?.status === false) {
    res.status(400);
    res.json({ status: false, message: "transaction couldn't created" });
  }

  const newbill = await Bill.create({
    user: new ObjectId(user),
    bills: bills,
    advance: advance,
    prevAdvance,
    due: due,
    dues: populatedBill,
    prevDue: due,
    isFullPaid,
    totalAmount: totalAmount,
    billNo: getCounter?.counter?.counter,
    isDistinct,
    payment,
    paymentTrx: [
      new ObjectId(advanceTrx?.transaction?._id),
      new ObjectId(paymentTrx?.transaction?._id),
    ],

    date: moment(dateString, format).toDate(),
  });

  const populatebill = await newbill.populate("user");

  res.status(200).json({
    status: true,
    message: "Bill created successfully",
    bill: populatebill,
  });
});

// @desc: update bill
// @route: PUT /api/bill/:id
// @access: private
const updateBill = asyncHandler(async (req, res) => {
  const existingbill = await Bill.findById(req.params.id);

  const {
    user,
    bills,
    advance,
    prevAdvance,
    due,
    dues,
    totalAmount,
    isFullPaid,
    isDistinct,
    payment,
    date,
  } = req.body;

  const dateString = date;
  const format = "DD/MM/YYYY";

  const existingUser = await User.findById(user);

  if (!existingbill) {
    res.status(400);
    throw new Error("Bill not found");
  }

  if (!existingUser) {
    res.status(400);
    res.json({ status: false, message: "User not found" });
  }

  let removedBills = [];
  let addedBill = [];

  const oldDues = existingbill?.dues.map((bill) =>
    new ObjectId(bill).toString()
  );
  removedBills = oldDues?.filter((bill) => !dues.includes(bill));
  addedBill = dues.filter((bill) => !oldDues?.includes(bill));

  const objectIdDues = dues?.length > 0 ? dues : [];

  const storedData = await addAndRemoveBillHandler(removedBills, addedBill);

  const populatedBill = await populateBills(objectIdDues);

  let advanceTrx;
  let paymentTrx;
  if (advance > 0 && existingbill?.advance !== advance)
    advanceTrx = await makePaymentAdvanceWithPayment(
      user,
      "advance",
      advance,
      existingbill?.paymentTrx[0]
    );
  if (payment > 0 && existingbill?.payment !== payment)
    paymentTrx = await makePaymentAdvanceWithPayment(
      user,
      "payment",
      payment,
      existingbill?.paymentTrx[1]
    );

  console.log("advanceTrx paymentTrx", advanceTrx, paymentTrx);

  if (advanceTrx?.status === false || paymentTrx?.status === false) {
    res.status(400);
    res.json({ status: false, message: "transaction couldn't created" });
  }

  const updatedbill = await Bill.findByIdAndUpdate(req.params.id, {
    user: new ObjectId(user),
    bills: bills,
    advance: advance,
    prevAdvance,
    dues: objectIdDues,
    due: due,
    prevDue: due,
    isFullPaid,
    totalAmount: totalAmount,
    isDistinct,
    payment,
    paymentTrx: [
      new ObjectId(advanceTrx?.transaction?._id),
      new ObjectId(paymentTrx?.transaction?._id),
    ],
    date: moment(dateString, format).toDate(),
  }).populate("user");

  res.status(200).json({
    status: true,
    message: "Bill updated successfully.",
    storedData: storedData,
    populateBills,
    bill: {
      ...updatedbill?._doc,
      user: existingUser,
      bills: bills,
      advance: advance,
      prevAdvance,
      due: due,
      dues: populatedBill,
      isFullPaid,
      isDistinct,
      payment,
      totalAmount: totalAmount,
      date: moment(dateString, format).toDate(),
    },
  });
});

// @desc: delete bill
// @route: DELETE /api/bill/:id
// @access: private
const deleteBill = asyncHandler(async (req, res) => {
  const existingbill = await Bill.findById(req.params.id);

  if (!existingbill) {
    res.status(400);
    res.json({ status: false, message: "Bill not found." });
  }

  Promise.all([
    deleteTransactionGlobal(existingbill?.paymentTrx[0]),
    deleteTransactionGlobal(existingbill?.paymentTrx[1]),
  ]);

  await existingbill.deleteOne();

  res.status(200).json({
    status: true,
    message: "Bill deleted successfully",
    bill: existingbill,
  });
});

// @desc: GET DUEs of bills
// @route: GET /api/bill/:id
// @access: private

const getDues = asyncHandler(async (req, res) => {
  /*
  isDistinct - true||false
  */
  const { userId, isDistinct, ignoreBill, alreadyAdded } = req.query;
  const filter = {};

  filter.$or = [{ prevDue: { $gt: 0 } }, { due: { $gt: 0 } }];
  // filter.prevDue = { $gt: 0 };
  // filter.due = { $gt: 0 };
  if (isDistinct !== undefined) {
    filter.isDistinct = isDistinct;
  }

  if (alreadyAdded !== undefined) {
    filter.alreadyAdded = alreadyAdded;
  }

  if (ignoreBill) {
    filter._id = { $ne: ignoreBill };
  }

  if (isValidObjectId(userId)) {
    filter.user = userId;
  }

  const dues = await Bill.find(filter).sort({ date: -1 }).populate("user");

  const totalDues = dues.reduce((prev, item) => {
    const totalDue = item?.totalAmount - item?.advance - item?.payment;

    return prev + totalDue;
  }, 0);

  const convertedDue = dues?.map((bill) => {
    const totalDue = bill?.totalAmount - bill?.advance - bill?.payment;

    return { ...bill?._doc, due: totalDue };
  });

  res.status(200).json({
    status: true,
    message: "Get Dues Successfully",
    // test: dues,
    convertedDue: convertedDue?._doc,
    summery: {
      totalDues: totalDues,
    },
    dues: convertedDue,
  });
});

const getDuesData = asyncHandler(async (req, res) => {
  /*
  isDistinct - true||false
  */
  const { userId, isDistinct, ignoreBill, alreadyAdded } = req.query;
  const filter = {};

  filter.$or = [{ prevDue: { $gt: 0 } }, { due: { $gt: 0 } }];
  // filter.prevDue = { $gt: 0 };
  // filter.due = { $gt: 0 };
  if (isDistinct !== undefined) {
    filter.isDistinct = isDistinct;
  }

  if (alreadyAdded !== undefined) {
    filter.alreadyAdded = alreadyAdded;
  }

  if (ignoreBill) {
    filter._id = { $ne: ignoreBill };
  }

  if (isValidObjectId(userId)) {
    filter.user = userId;
  }

  const dues = await Bill.find(filter).sort({ date: -1 }).populate("user");

  const totalDues = dues.reduce((prev, item) => {
    const totalDue = item?.totalAmount - item?.advance - item?.payment;

    return prev + totalDue;
  }, 0);

  const convertedDue = dues?.map((bill) => {
    const totalDue = bill?.totalAmount - bill?.advance - bill?.payment;

    return { ...bill?._doc, due: totalDue };
  });

  return {
    // test: dues,
    summery: {
      totalDues: totalDues,
    },
    dues: convertedDue,
  };
});

module.exports = {
  getBill,
  getBills,
  addBill,
  updateBill,
  deleteBill,
  getDues,
  getDuesData,
  getBillsData,
};

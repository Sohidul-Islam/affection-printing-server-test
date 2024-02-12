const asyncHandler = require("express-async-handler");
const Quotation = require("../models/quotationModel");
const { incrementByOneCounterByType } = require("./counterController");
const User = require("../models/userModel");
const moment = require("moment/moment");

const ObjectId = require("mongodb").ObjectId;

// @desc: get quotation
// @route: GET /api/quotation/:id
// @access: private

const getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate("user");

  if (!quotation) {
    res
      .status(200)
      .json({ status: false, message: `Quotation not found`, quotation: {} });
  }

  res.status(200).json({
    status: true,
    message: `Quotation found successfully`,
    quotation: { ...quotation?._doc },
  });
});

// @desc: get quotation
// @route: GET /api/quotation
// query: startDate,endDate: 2023-08-01, sortBy: asc,dsc, searchKey
// @access: private
const getQuotations = asyncHandler(async (req, res) => {
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
      { "quotations.title": { $regex: new RegExp(searchKey, "i") } }, // Case-insensitive search
      { subject: { $regex: new RegExp(searchKey, "i") } },
    ];

    filters.$or = !isNaN(parseInt(searchKey, 10))
      ? [...filters.$or, { quotationNo: parseInt(searchKey, 10) }]
      : [...filters.$or];
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Quotation.find(filters)
    .sort({
      quotationNo: sortBy === "asc" ? 1 : -1,
    })
    .populate("user")
    .exec();

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginatedQuotations = filteredData?.slice(
    skipDocuments,
    skipDocuments + pageSize
  );

  res.status(200).json({
    status: true,
    message: `Quotations found successfully`,
    quotations: paginatedQuotations,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  });
});

const getQuotationsData = asyncHandler(async (req, res) => {
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
      { "quotations.title": { $regex: new RegExp(searchKey, "i") } }, // Case-insensitive search
      { subject: { $regex: new RegExp(searchKey, "i") } },
    ];

    filters.$or = !isNaN(parseInt(searchKey, 10))
      ? [...filters.$or, { quotationNo: parseInt(searchKey, 10) }]
      : [...filters.$or];
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Quotation.find(filters)
    .sort({
      quotationNo: sortBy === "asc" ? 1 : -1,
    })
    .populate("user")
    .exec();

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

  const paginatedQuotations = filteredData?.slice(
    skipDocuments,
    skipDocuments + pageSize
  );

  return {
    quotations: paginatedQuotations,
    totalQuotations: totalCount,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  };
});

// @desc: add quotation
// @route: POST /api/quotation/:id
// @access: private
const addQuotation = asyncHandler(async (req, res) => {
  const { user, subject, quotations, date, note } = req.body;

  const dateString = date;
  const format = "DD/MM/YYYY";

  if (user || !quotations?.length || !date || !subject) {
    res.status(400);
  }

  const existingUser = await User.findById(req?.body?.user);

  if (!existingUser) {
    res.status(400);
    res.json({ status: false, message: "User not found" });
  }

  const getCounter = await incrementByOneCounterByType("quotation");

  const newQuotation = await Quotation.create({
    user: new ObjectId(user),
    quotationNo: getCounter?.counter?.counter,
    quotations: quotations,
    subject,
    date: moment(dateString, format).toDate(),
    note,
  });

  const populatedQuotation = await newQuotation.populate("user");

  res.status(200).json({
    status: true,
    message: "Quotation created successfully",
    quotation: populatedQuotation,
  });
});

// @desc: update quotation
// @route: PUT /api/quotation/:id
// @access: private
const updateQuotation = asyncHandler(async (req, res) => {
  const existingQuotation = await Quotation.findById(req.params.id);

  const { user, subject, quotations, date, note } = req.body;

  const dateString = date;
  const format = "DD/MM/YYYY";

  const existingUser = await User.findById(user);

  if (!existingQuotation) {
    res.status(400);
    throw new Error("Quotation not found");
  }

  if (!existingUser) {
    res.status(400);
    res.json({ status: false, message: "User not found" });
  }

  const updatedQuotation = await Quotation.findByIdAndUpdate(req.params.id, {
    user: new ObjectId(user),
    quotations: quotations,
    subject,
    date: moment(dateString, format).toDate(),
    note,
  }).populate("user");

  res.status(200).json({
    status: true,
    message: "Quotation updated successfully.",
    quotation: {
      ...updatedQuotation?._doc,
      quotations,
      subject,
      date: moment(dateString, format).toDate(),
      note,
    },
  });
});

// @desc: delete quotation
// @route: DELETE /api/quotation/:id
// @access: private
const deleteQuotation = asyncHandler(async (req, res) => {
  const existingQuotation = await Quotation.findById(req.params.id);

  if (!existingQuotation) {
    res.status(400);
    res.json({ status: false, message: "Quotation not found." });
  }

  await existingQuotation.deleteOne();

  res.status(200).json({
    status: true,
    message: "Quotation deleted successfully",
    quotation: existingQuotation,
  });
});

module.exports = {
  getQuotation,
  getQuotations,
  addQuotation,
  updateQuotation,
  deleteQuotation,
  getQuotationsData,
};

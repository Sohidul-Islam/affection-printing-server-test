const asyncHandler = require("express-async-handler");
const Challan = require("../models/challanModel");
const {
  addCounter,
  incrementByOneCounterByType,
} = require("./counterController");
const User = require("../models/userModel");
const moment = require("moment/moment");
const { isNumber } = require("lodash");

const ObjectId = require("mongodb").ObjectId;

// @desc: get challan
// @route: GET /api/challan/:id
// @access: private

const getChallan = asyncHandler(async (req, res) => {
  const challan = await Challan.findById(req.params.id);

  if (!challan) {
    res
      .status(200)
      .json({ status: false, message: `Challan not found`, challan: {} });
  }

  await challan.populate("user");

  res.status(200).json({
    status: true,
    message: `Challan found successfully`,
    challan: challan,
  });
});

// @desc: get challan
// @route: GET /api/challan
// query: startDate,endDate: 2023-08-01, sortBy: asc,dsc, searchKey
// @access: private
const getChallans = asyncHandler(async (req, res) => {
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
      { "challans.desc": { $regex: new RegExp(searchKey, "i") } }, // Case-insensitive search
    ];

    filters.$or = !isNaN(parseInt(searchKey, 10))
      ? [...filters.$or, { challanNo: parseInt(searchKey, 10) }]
      : [...filters.$or];
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Challan.find(filters)
    .sort({
      challanNo: sortBy === "asc" ? 1 : -1,
    })
    .populate("user");
  // .limit(pageSize)
  // .skip(skipDocuments)
  // .exec();

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginatedChallans = filteredData?.slice(
    skipDocuments,
    skipDocuments + pageSize
  );

  res.status(200).json({
    status: true,
    message: `Challans found successfully`,
    challans: paginatedChallans,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  });
});

const getChallansData = asyncHandler(async (req, res) => {
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
    filters.$or = [
      { "challans.desc": { $regex: new RegExp(searchKey, "i") } }, // Case-insensitive search
    ];

    filters.$or = !isNaN(parseInt(searchKey, 10))
      ? [...filters.$or, { challanNo: parseInt(searchKey, 10) }]
      : [...filters.$or];
  }

  if (userId) {
    filters["user"] = userId;
  }

  const filteredData = await Challan.find(filters)
    .sort({
      challanNo: sortBy === "asc" ? 1 : -1,
    })
    .populate("user");
  // .limit(pageSize)
  // .skip(skipDocuments)
  // .exec();

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

  const paginatedChallans =
    pageSize > 0
      ? filteredData?.slice(skipDocuments, skipDocuments + pageSize)
      : filteredData;

  return {
    challans: paginatedChallans,
    totalChallan: totalCount,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  };
});

// @desc: add challan
// @route: POST /api/challan/:id
// @access: private
const addChallan = asyncHandler(async (req, res) => {
  const { user, challans, date } = req.body;

  const dateString = date;
  const format = "DD/MM/YYYY";

  const testDate = moment(dateString, format).toDate();

  if (!user || !challans?.length || !date) {
    res.status(400);
  }

  const existingUser = await User.findById(user);

  if (!existingUser) {
    res.status(400);
    res.json({ status: false, message: "User not found" });
  }

  const getCounter = await incrementByOneCounterByType("challan");

  const newChallan = await Challan.create({
    user: new ObjectId(user),
    challans,
    challanNo: getCounter?.counter?.counter,
    date: moment(dateString, format).toDate(),
  });

  const populateChallan = await newChallan.populate("user");

  res.status(200).json({
    status: true,
    message: "Challan created successfully",
    challan: populateChallan,
  });
});

// @desc: update challan
// @route: PUT /api/challan/:id
// @access: private
const updateChallan = asyncHandler(async (req, res) => {
  const existingChallan = await Challan.findById(req.params.id);

  const { user, challans, date } = req.body;

  const dateString = date;
  const format = "DD/MM/YYYY";

  const existingUser = await User.findById(user);

  if (!existingChallan) {
    res.status(400);
    throw new Error("Challan not found");
  }

  if (!existingUser) {
    res.status(400);
    res.json({ status: false, message: "User not found" });
  }

  const updatedChallan = await Challan.findByIdAndUpdate(req.params.id, {
    user: new ObjectId(user),
    challans,
    date: moment(dateString, format).toDate(),
  }).populate("user");

  res.status(200).json({
    status: true,
    message: "Challan updated successfully.",
    challan: {
      ...updatedChallan?._doc,
      user: existingUser,
      date: moment(dateString, format).toDate(),
      challans,
    },
  });
});

// @desc: delete challan
// @route: DELETE /api/challan/:id
// @access: private
const deleteChallan = asyncHandler(async (req, res) => {
  const existingChallan = await Challan.findById(req.params.id);

  if (!existingChallan) {
    res.status(200);
    res.json({ status: false, message: "Challan not found." });
  }

  await existingChallan.deleteOne();

  res.status(200).json({
    status: true,
    message: "Challan deleted successfully",
    challan: existingChallan,
  });
});

module.exports = {
  getChallan,
  getChallans,
  addChallan,
  updateChallan,
  deleteChallan,
  getChallansData,
};

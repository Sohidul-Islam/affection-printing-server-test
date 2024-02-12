const { model, default: mongoose } = require("mongoose");

const User = require("../models/userModel");

const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");

// @desc: This is test api
// @route: /api
// @access: public
const testApi = asyncHandler(async (req, res) => {
  res.status(200).json({ msg: "Welcome to affection World" });
});

// @desc: get all users
// @route: GET /api/user
// @access: private
const getUsers = asyncHandler(async (req, res) => {
  // @data filter keys
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
    // filters["name"] = { $regex: new RegExp(searchKey, "i") };

    filters.$or = [
      { name: { $regex: searchKey, $options: "i" } }, // Case-insensitive search
      { address: { $regex: searchKey, $options: "i" } },
      { phone: { $regex: searchKey, $options: "i" } },
      { email: { $regex: searchKey, $options: "i" } },
      { vatNo: { $regex: searchKey, $options: "i" } },
    ];

    filters.$or = mongoose.isValidObjectId(searchKey)
      ? [...filters.$or, { _id: new ObjectId(searchKey) }]
      : [...filters.$or];
  }

  if (mongoose.isValidObjectId(userId)) {
    filters._id = userId;
  }

  const key = sortBy ? "name" : "createdAt";

  const filteredData = await User.find(filters).sort({
    [key]: sortBy === "asc" ? 1 : -1,
  });

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginatedUserss = filteredData?.slice(
    skipDocuments,
    skipDocuments + pageSize
  );

  res.status(200).json({
    status: true,
    message: "Successfully fetched data",
    users: paginatedUserss,
    paginatedData: {
      totalData: totalCount,
      page,
      pageSize,
      totalPages,
    },
  });
});

// @desc: get all users
// @route: GET /api/user/:id
// @access: private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res
      .status(200)
      .json({ status: false, message: "User not found", user: {} });
  }

  res
    .status(200)
    .json({ status: true, message: "Successfully fetched data", user: user });
});

// @desc: add user
// @route: POST /api/user
// @access: private
const addUser = asyncHandler(async (req, res) => {
  const { name, address, vatNo, email, phone, image } = req.body;

  if (!name || !address || !phone) {
    res.status(400);
  }

  let data = {};

  if (email) {
    data = { ...data, email };
  }

  if (vatNo) {
    data = { ...data, vatNo };
  }

  if (image) {
    data = { ...data, image };
  }

  newUser = await User.create({ name, address, phone, ...data });

  res.status(200).json({
    status: true,
    message: `Created new user successfully`,
    user: newUser,
  });
});

// @desc: update user
// @route: PUT /api/user
// @access: private
const updateUser = asyncHandler(async (req, res) => {
  const existingUser = await User.findById(req.params.id);

  if (!existingUser) {
    res.status(400);
    throw new Error("User not found");
  }

  const { name, address, vatNo, email, phone, image } = req.body;

  let data = {};

  if (email) {
    data = { ...data, email };
  }

  if (vatNo) {
    data = { ...data, vatNo };
  }

  if (image) {
    data = { ...data, image };
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, {
    name,
    address,
    phone,
    ...data,
  });

  res.status(200).json({
    status: true,
    message: "User updated successfully.",
    user: updatedUser,
  });
});

// @desc: delete user
// @route: DELETE /api/user/:id
// @access: private
const deleteUser = asyncHandler(async (req, res) => {
  const existingUser = await User.findById(req.params.id);

  if (!existingUser) {
    res.status(400);
    throw new Error("User not found");
  }

  await existingUser.deleteOne();

  res.status(200).json({
    status: true,
    message: "Delete user successfully",
    data: existingUser,
  });
});

module.exports = {
  testApi,
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
};

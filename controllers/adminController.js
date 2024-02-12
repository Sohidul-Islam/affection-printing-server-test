const { default: mongoose } = require("mongoose");

const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const encryptpwd = require("encrypt-with-password");

const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");

var jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

dotenv.config();

const adminToken = jwt.sign({ foo: "bar" }, "shhhhh", {
  expiresIn: "6004800s",
});

const passwordKey = "passwordSecurity";

function generateAccessToken(name, email, _id) {
  return jwt.sign({ name, email, _id }, "shhhhh", { expiresIn: "30 days" });
}

// verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token === null)
    return res.status(401).json({
      success: false,
      message: "Error!Token was not provided.",
    });

  jwt.verify(token, "shhhhh", (err, user) => {
    console.log({ err, user });

    if (err)
      return res.status(403).json({
        success: false,
        message: "Invalid Token.",
      });

    console.log("Granted");
    req.user = user;

    next();
  });
}

const getEncryptedPassword = (password) => {
  const encryptedPassword = encryptpwd.encrypt(password, passwordKey);
  return encryptedPassword;
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.query;

  if (!email) {
    res
      .status(200)
      .json({ status: false, message: "Email is required", user: {} });
  }

  if (!password) {
    res
      .status(200)
      .json({ status: false, message: "Password is required", user: {} });
  }

  if (!email && !password) {
    res.status(200).json({
      status: false,
      message: "Email & password is required",
      user: {},
    });
  }

  const user = await Admin.findOne({ email: email, password: password });

  if (!user) {
    res
      .status(200)
      .json({ status: false, message: "User not found", user: {} });
  }

  const accessToken = generateAccessToken(
    user?._doc?.name,
    user?._doc?.email,
    user?._doc?._id
  );

  res.status(200).json({
    status: true,
    message: "Successfully Logged In",
    user: {
      ...user?._doc,
      password: getEncryptedPassword(user?._doc?.password),
      accessToken,
    },
  });
});

// @desc: get all users
// @route: GET /api/user
// @access: private
const getAdmins = asyncHandler(async (req, res) => {
  // @data filter keys
  const { searchKey, startDate, endDate, sortBy, adminId } = req.query;
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
      { phone: { $regex: searchKey, $options: "i" } },
      { email: { $regex: searchKey, $options: "i" } },
    ];

    filters.$or = mongoose.isValidObjectId(searchKey)
      ? [...filters.$or, { _id: new ObjectId(searchKey) }]
      : [...filters.$or];
  }

  if (mongoose.isValidObjectId(adminId)) {
    filters._id = adminId;
  }

  const key = sortBy ? "name" : "createdAt";

  const filteredData = await Admin.find(filters).sort({
    [key]: sortBy === "asc" ? 1 : -1,
  });

  const totalCount = filteredData?.length || 0; // Get the total count of documents

  // Calculate the total number of pages based on the pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  let paginatedAdmins = filteredData?.slice(
    skipDocuments,
    skipDocuments + pageSize
  );

  paginatedAdmins = paginatedAdmins?.map((data) => {
    const encryptedPassword = getEncryptedPassword(data?._doc?.password);

    return { ...data?._doc, password: encryptedPassword };
  });

  res.status(200).json({
    status: true,
    message: "Successfully fetched data",
    admins: paginatedAdmins,
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
const getAdmin = asyncHandler(async (req, res) => {
  const user = await Admin.findById(req.params.id);
  if (!user) {
    res
      .status(200)
      .json({ status: false, message: "Admin not found", user: {} });
  }

  res.status(200).json({
    status: true,
    message: "Successfully fetched data",
    user: {
      ...user?._doc,
      password: getEncryptedPassword(user?._doc?.password),
    },
  });
});

// @desc: add user
// @route: POST /api/user
// @access: private
const addAdminDefault = asyncHandler(async (req, res) => {
  const defaultAdmin = {
    name: "admin",
    email: "admin@gmail.com",
    phone: "018541076888",
    image: "",
    password: "123456",
  };

  const { name, email, phone, image, password } = defaultAdmin;

  if (!name || !phone || !email || !password) {
    res.status(400);
  }

  let data = {};

  if (email) {
    data = { ...data, email };
  }

  if (phone) {
    data = { ...data, phone };
  }

  if (image) {
    data = { ...data, image };
  }

  if (password) {
    data = { ...data, password };
  }

  const admins = await Admin.create({ name, ...data });

  res.status(200).json({
    status: true,
    message: `Created new user successfully`,
    admin: {
      ...admins?._doc,
      password: getEncryptedPassword(admins?._doc?.password),
    },
  });
});

const addAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, image, password } = req.body;

  if (!name || !phone || !email || !password) {
    res.status(400);
  }

  let data = {};

  if (email) {
    data = { ...data, email };
  }

  if (phone) {
    data = { ...data, phone };
  }

  if (image) {
    data = { ...data, image };
  }

  if (password) {
    data = { ...data, password };
  }

  const admins = await Admin.create({ name, ...data });

  res.status(200).json({
    status: true,
    message: `Created new user successfully`,
    admin: {
      ...admins?._doc,
      password: getEncryptedPassword(admins?._doc?.password),
    },
  });
});

// @desc: update user
// @route: PUT /api/user
// @access: private
const updateAdmin = asyncHandler(async (req, res) => {
  const existingUser = await Admin.findById(req.params.id);

  if (!existingUser) {
    res.status(400);
    throw new Error("User not found");
  }

  const { name, email, phone, image, password } = req.body;

  let data = {};

  if (email) {
    data = { ...data, email };
  }

  if (phone) {
    data = { ...data, phone };
  }

  if (image) {
    data = { ...data, image };
  }
  if (password) {
    data = { ...data, password };
  }

  const updatedAdmin = await Admin.findByIdAndUpdate(req.params.id, {
    name,
    phone,
    ...data,
  });

  res.status(200).json({
    status: true,
    message: "Admin updated successfully.",
    admin: {
      ...updatedAdmin?._doc,
      password: getEncryptedPassword(updatedAdmin?._doc?.password),
    },
  });
});

// @desc: delete user
// @route: DELETE /api/user/:id
// @access: private
const deleteAdmin = asyncHandler(async (req, res) => {
  const existingAdmin = await Admin.findById(req.params.id);

  if (!existingAdmin) {
    res.status(400);
    throw new Error("admin not found");
  }

  await existingAdmin.deleteOne();

  res.status(200).json({
    status: true,
    message: "Delete user successfully",
    data: existingAdmin,
  });
});

module.exports = {
  authenticateToken,
  addAdminDefault,
  login,
  getAdmins,
  getAdmin,
  addAdmin,
  updateAdmin,
  deleteAdmin,
};

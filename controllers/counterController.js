const asyncHandler = require("express-async-handler");

const ObjectId = require("mongodb").ObjectId;

const Counter = require("../models/counterModel");

// @desc: get counter by type
// @route: GET /api/counter -- not required
// @access: private
const getCounterByType = asyncHandler(async (req, res, type) => {
  const counter = await Counter.findOne({ type: type });

  res.status(200).json({
    status: true,
    message: `Counter found successfully`,
    counter: counter,
  });
});

// @desc: add challan
// @route: POST /api/counter/:type -- not required
// @access: private
const addCounter = asyncHandler(async (type) => {
  if (!type) {
    return {
      status: false,
      message: "No type found",
    };
  }

  const newCounter = await Counter.create({
    type,
    counter: 1,
  });

  return {
    status: true,
    message: "New counter successfully",
    counter: newCounter,
  };
});

// @desc: update challan
// @route: PUT /api/challan/:id
// @access: private
const incrementByOneCounterByType = asyncHandler(async (type) => {
  const getCounter = await Counter.findOne({ type });

  if (getCounter) {
    getCounter.$inc("counter", 1);

    getCounter.save();

    return { status: true, counter: getCounter };
  } else {
    const newCounter = await addCounter(type);

    return newCounter;
  }
});

// @desc: delete challan
// @route: DELETE /api/challan/:id
// @access: private
const deleteCounter = asyncHandler((req, res) => {
  res.status(200).json({ message: "delete challans" });
});

module.exports = {
  getCounterByType,
  addCounter,
  incrementByOneCounterByType,
  deleteCounter,
};

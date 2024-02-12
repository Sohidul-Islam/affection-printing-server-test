const mongoose = require("mongoose");

const billsSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Assuming your users collection is named "users"
      required: [true, "Please select a user"],
    },
    billNo: {
      type: Number,
      require: [true, "Please provide bill number"],
    },
    bills: {
      type: Array,
      required: [true, "Please add a bill"],
      default: [],
    },
    date: {
      type: Date,
      required: [true, "Please select a date"],
      default: Date.now,
    },
    advance: {
      type: Number,
      default: 0,
    },

    prevAdvance: {
      type: Number,
      default: 0,
    },
    payment: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    totalAmountWithLastDue: {
      type: Number,
      default: 0,
    },
    isFullPaid: {
      type: Boolean,
      default: false,
    },
    isDistinct: {
      type: Boolean,
      default: false,
    },
    due: {
      type: Number,
      default: 0,
    },
    prevDue: {
      type: Number,
      default: 0,
    },
    dues: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "bills",
      default: [],
    },
    alreadyAdded: {
      type: Boolean,
      default: false,
    },

    paymentTrx: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "transaction",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("bills", billsSchema);

const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Assuming your users collection is named "users"
      required: [true, "Please select a user"],
    },
    transactionId: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: {
        values: ["advance", "payment"],
        message: "{VALUE} is not supported",
      },
      default: "",
    },
    payment: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("transaction", transactionSchema);

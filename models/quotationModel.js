const mongoose = require("mongoose");

const quotationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Assuming your users collection is named "users"
      required: [true, "Please select a user"],
    },
    subject: {
      type: String,
      require: [true, "Please provide quotation subject"],
    },
    quotationNo: {
      type: Number,
      require: [true, "Please provide quotation number"],
    },

    date: {
      type: Date,
      required: [true, "Please select a date"],
      default: Date.now,
    },
    quotations: {
      type: Array,
      required: [true, "Please add a quotation"],
      default: [],
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("quotations", quotationSchema);

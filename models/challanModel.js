const mongoose = require("mongoose");

const challansSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Assuming your users collection is named "users"
      required: [true, "Please select a user"],
    },
    challanNo: {
      type: Number,
      require: [true, "Please provide challan number"],
    },
    challans: {
      type: Array,
      required: [true, "Please add a challan"],
      default: [],
    },
    date: {
      type: Date,
      required: [true, "Please select a date"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("challans", challansSchema);

const mongoose = require("mongoose");

const counterSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ["bill", "challan", "quotation", "order", "transaction"],
        message: "{VALUE} is not supported",
      },
    },
    counter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("counter", counterSchema);

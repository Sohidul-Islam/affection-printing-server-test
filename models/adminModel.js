const mongoose = require("mongoose");

const adminSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide phone"],
      unique: true,
    },
    image: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("admins", adminSchema);

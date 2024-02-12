const express = require("express");
const {
  getBill,
  getBills,
  addBill,
  updateBill,
  deleteBill,
  getDues,
} = require("../controllers/billController");
const { authenticateToken } = require("../controllers/adminController");

const router = express.Router();

router
  .get("/bill/dues", authenticateToken, getDues)
  .get("/bill/:id", authenticateToken, getBill)
  .get("/bill", authenticateToken, getBills)
  .post("/bill", authenticateToken, addBill)
  .put("/bill/:id", authenticateToken, updateBill)
  .delete("/bill/:id", authenticateToken, deleteBill);

module.exports = router;

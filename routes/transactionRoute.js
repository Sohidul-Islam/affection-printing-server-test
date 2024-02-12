const express = require("express");
const {
  makeTransaction,
  getTransactions,
  deleteTransaction,
} = require("../controllers/transactionController");
const { authenticateToken } = require("../controllers/adminController");

const router = express.Router();

router
  .get("/transaction", authenticateToken, getTransactions)
  .post("/transaction", authenticateToken, makeTransaction)
  .delete("/transaction/:id", authenticateToken, deleteTransaction);
//   .get("/transaction/:id", getBill)
//   .get("/transaction", getBills)
//   .put("/transaction/:id", updateBill)

module.exports = router;

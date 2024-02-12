const express = require("express");
const {
  getQuotation,
  getQuotations,
  addQuotation,
  updateQuotation,
  deleteQuotation,
} = require("../controllers/quotationsController");
const { authenticateToken } = require("../controllers/adminController");

const router = express.Router();

router
  .get("/quotation/:id", authenticateToken, getQuotation)
  .get("/quotation", authenticateToken, getQuotations)
  .post("/quotation", authenticateToken, addQuotation)
  .put("/quotation/:id", authenticateToken, updateQuotation)
  .delete("/quotation/:id", authenticateToken, deleteQuotation);

module.exports = router;

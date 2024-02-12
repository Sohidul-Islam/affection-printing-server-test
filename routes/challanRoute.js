const express = require("express");
const {
  getChallan,
  getChallans,
  addChallan,
  updateChallan,
  deleteChallan,
} = require("../controllers/challanController");
const { authenticateToken } = require("../controllers/adminController");

const router = express.Router();

router
  .get("/challan/:id", authenticateToken, getChallan)
  .get("/challan", authenticateToken, getChallans)
  .post("/challan", authenticateToken, addChallan)
  .put("/challan/:id", authenticateToken, updateChallan)
  .delete("/challan/:id", authenticateToken, deleteChallan);

module.exports = router;

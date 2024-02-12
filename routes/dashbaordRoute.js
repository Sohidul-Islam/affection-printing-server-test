const express = require("express");
const { getDashboard } = require("../controllers/dashBoardController");
const { authenticateToken } = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", authenticateToken, getDashboard);

module.exports = router;

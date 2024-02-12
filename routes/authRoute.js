const express = require("express");
const {
  getAdmin,
  login,
  authenticateToken,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/login", login).get("/login/:id", authenticateToken, getAdmin);

module.exports = router;

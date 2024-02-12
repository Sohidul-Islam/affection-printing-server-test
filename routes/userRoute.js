const express = require("express");
const {
  testApi,
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { authenticateToken } = require("../controllers/adminController");

const router = express.Router();

router.get("/", testApi);

router
  .get("/user", authenticateToken, getUsers)
  .get("/user/:id", authenticateToken, getUser)
  .post("/user", authenticateToken, addUser)
  .put("/user/:id", authenticateToken, updateUser)
  .delete("/user/:id", authenticateToken, deleteUser);

module.exports = router;

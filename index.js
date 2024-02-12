const express = require("express");
const colors = require("colors");
const { errorHandler } = require("./middleware/errorMiddleware");
const { connectWithDB } = require("./config/db");
var cors = require("cors");

const dotenv = require("dotenv").config();

const port = process.env.PORT || 5000;

// make connection with database MONGODB
connectWithDB();

const app = express();
app.use(cors());

// The express.json() function is a built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", require("./routes/userRoute"));
app.use("/api", require("./routes/challanRoute"));
app.use("/api", require("./routes/billRoute"));
app.use("/api", require("./routes/transactionRoute"));
app.use("/api", require("./routes/quotationRoute"));
app.use("/api", require("./routes/dashbaordRoute"));
app.use("/api", require("./routes/adminRoute"));
app.use("/api", require("./routes/authRoute"));

app.use(errorHandler);

app.listen(port, () => console.log("server started on", port));

// First make sure have install it... (try with: npm i mongoose)
const mongoose = require("mongoose");

// connect database callback

const connectWithDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.DB_URI);
    console.log(`Mongodb Connected ${connect.connection.host}`.cyan.underline);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = {
  connectWithDB,
};

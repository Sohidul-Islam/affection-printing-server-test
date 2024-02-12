const asyncHandler = require("express-async-handler");
const Transaction = require("../../models/transactionModel");
const Bill = require("../../models/billModel");
const { incrementByOneCounterByType } = require("../counterController");

const moment = require("moment/moment");
const { isValidObjectId } = require("mongoose");

const ObjectId = require("mongodb").ObjectId;

const makePaymentAdvanceWithPayment = asyncHandler(
  async (userId, type, amount, tnxid, billId = "none") => {
    if (!isValidObjectId(userId) || !type || !amount) {
      return { status: false, transaction: {} };
    }

    if (isValidObjectId(tnxid)) {
      const isTransactionExist = await Transaction.findOne(tnxid);

      if (isTransactionExist) {
        const updatedTransaction = await Transaction.findByIdAndUpdate(tnxid, {
          payment: amount,
        });

        return { status: true, transaction: updatedTransaction };
      }
    }

    const getCounter = await incrementByOneCounterByType("transaction");

    const transactionId = `AFF${moment(new Date()).format("DDMMYYYY")}${
      getCounter?.counter?.counter
    }`;

    const createTransaction = await Transaction.create({
      user: new ObjectId(userId),
      payment: amount,
      type,
      transactionId,
    });

    if (isValidObjectId(billId)) {
      const billData = await Bill.findOne(billId);

      if (type === "payment" && billData) {
        await Bill.findByIdAndUpdate(billId, {
          paymentTrx: [
            new ObjectId(billData?.paymentTrx[0]),
            new ObjectId(createTransaction?._id),
          ],
        });
      }
      if (type === "advance" && billData) {
        await Bill.findByIdAndUpdate(billId, {
          paymentTrx: [
            new ObjectId(createTransaction?._id),
            new ObjectId(billData?.paymentTrx[1]),
          ],
        });
      }
    }

    return { status: true, transaction: createTransaction };
  }
);

module.exports = {
  makePaymentAdvanceWithPayment,
};

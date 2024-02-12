const asyncHandler = require("express-async-handler");
const Bill = require("../../models/billModel");
const { incrementByOneCounterByType } = require("../counterController");
const User = require("../../models/userModel");
const moment = require("moment/moment");
const { isValidObjectId } = require("mongoose");
const { makePaymentAdvanceWithPayment } = require("./helpersForTransaction");
const ObjectId = require("mongodb").ObjectId;

const addAndRemoveBillHandler = asyncHandler(
  async (removedBills, addedBill) => {
    const removed = await Bill.find({ _id: { $in: removedBills } });
    const added = await Bill.find({ _id: { $in: addedBill } });

    if (removed?.length > 0) {
      // Loop through each document and update with distinct value
      Promise.all(
        removed.map((dueBill) => {
          const dueAmount =
            dueBill?.totalAmount - dueBill?.advance - dueBill?.payment;

          const updateObject = {
            due: dueAmount,
            prevDue: dueAmount,
            alreadyAdded: false,
          };

          return Bill.updateOne(
            { _id: dueBill._id }, // Match document with the provided ID
            { $set: updateObject } // Update the specified field with distinct value
          );
        })
      );
    }

    if (added?.length > 0) {
      // Loop through each document and update with distinct value
      Promise.all(
        added.map((dueBill) => {
          const dueAmount =
            dueBill?.totalAmount - dueBill?.advance - dueBill?.payment;
          const updateObject = {
            due: 0,
            prevDue: dueAmount,
            alreadyAdded: true,
          };

          return Bill.updateOne(
            { _id: dueBill._id }, // Match document with the provided ID
            { $set: updateObject } // Update the specified field with distinct value
          );
        })
      );
    }

    return {
      status: true,
      addedBill: added,
      removedBill: removed,
    };
  }
);

const populateBills = asyncHandler(async (bills) => {
  const populatedBill = await Bill.find({ _id: { $in: bills } });

  const convertedDue = populatedBill?.map((bill) => {
    const totalDue = bill?.totalAmount - bill?.advance - bill?.payment;

    return { ...bill?._doc, due: totalDue };
  });

  return convertedDue;
});

const payBillByTransaction = asyncHandler(async (userId, paid) => {
  let pay = Number(paid);

  const filter = {};

  filter.$or = [{ prevDue: { $gt: 0 } }, { due: { $gt: 0 } }];

  if (isValidObjectId(userId)) {
    filter.user = userId;
  }

  const getBillByUserId = await Bill.find(filter);

  // isFullPaid

  const convertedDue = getBillByUserId?.map((bill) => {
    let totalDue = bill?.totalAmount - bill?.advance - bill?.payment;
    let payment = bill?.payment || 0;

    if (pay <= totalDue) {
      payment += pay;
      totalDue -= pay;
      pay = 0;
    } else {
      payment += totalDue;
      pay -= totalDue;

      totalDue -= payment;
    }

    return { ...bill?._doc, due: totalDue, payment };
  });

  Promise.all(
    convertedDue.map((dueBill) => {
      const dueAmount =
        dueBill?.totalAmount - dueBill?.advance - dueBill?.payment;

      if (dueBill?.payment > 0) {
        makePaymentAdvanceWithPayment(
          dueBill?.user,
          "payment",
          dueBill?.payment,
          dueBill?.paymentTrx[1],
          dueBill?._id
        );
      }

      const updateObject = {
        due: dueAmount,
        prevDue: dueAmount,
        isFullPaid: dueAmount > 0 ? false : true,
        payment: dueBill?.payment,
      };

      return Bill.updateOne(
        { _id: dueBill?._id }, // Match document with the provided ID
        { $set: updateObject } // Update the specified field with distinct value
      );
    })
  );

  return { oldDue: getBillByUserId, convertedDue };
});

module.exports = {
  addAndRemoveBillHandler,
  populateBills,
  payBillByTransaction,
};

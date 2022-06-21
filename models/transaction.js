const mongoose = require("mongoose")
// this is the schema specially for transaction storation for admin purpse.
const TransactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOfUser",
    },
    date: {
      type: String,
    },
    monthIndex: {
      type: Number,
    },
    year: {
      type: Number,
    },
    // this is basically order id.
    orderId: {
      type: Number,
    },
  },
  { timestamps: true }
)
module.exports = mongoose.model("TransactionDetail", TransactionSchema)

const mongoose = require("mongoose")
const PurchaseSchema = new mongoose.Schema({
  nameofpurchase: {
    type: String,
  },
  price: {
    type: Number,
  },
  order: {
    type: Number,
    required: true,
  },
  for: {
    type: String,
    required: true,
  },
})
module.exports = mongoose.model("Purchase", PurchaseSchema)

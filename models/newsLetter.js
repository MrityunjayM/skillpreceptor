const mongoose = require("mongoose")
const EmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    date: {
      type: String,
    },
    subscribed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)
module.exports = mongoose.model("Email", EmailSchema)

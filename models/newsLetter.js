const mongoose = require("mongoose")
const schemaValidator = require("mongoose-unique-validator")

const EmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
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

EmailSchema.plugin(schemaValidator)

module.exports = mongoose.model("Email", EmailSchema)

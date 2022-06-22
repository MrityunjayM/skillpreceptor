const express = require("express")
const router = express.Router()
const AppError = require("../controlError/AppError")
const wrapAsync = require("../controlError/wrapAsync")
const Email = require("../models/newsLetter")
const { timingFormat } = require("../helper/date")
const { getMonthlySubscriber } = require("../helper/admin_middleware")
const User = require("../models/user")

// /admin/lead
router.get("/monthlynews", async (req, res) => {
  const dateNow = timingFormat(new Date())
  const { month, year } = dateNow
  const firstDayOfMonth = year + "-" + month + "-" + "01"
  var getDaysArray = (start, end) => {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt))
    }
    return arr
  }
  // here as a parameter i am passing the date in datePattern of timingFormat function
  var dayList = getDaysArray(new Date(firstDayOfMonth), new Date())
  // again passing the found date inside map function for getting the date like 10-03-2022.
  const newList = dayList.map((e) => timingFormat(e).dateformattransaction)
  // pushing last date inside newList(we have weekly data here).
  newList.push(dateNow.dateformattransaction)
  // subscribed user this month.
  const subscribedUser = await Email.find({
    date: { $in: newList },
  })
  return res.send(subscribedUser.length)
})
// more detail of emaill newsletter means  email of user..
router.get("/maillist", async (req, res) => {
  const monthlySubscriber = await getMonthlySubscriber()
  return res.render("admin/monthlyMailList", { monthlySubscriber })
})

// use data on the basis of date sorting on admin dashboard.
router.get("/alldata", async (req, res) => {
  const user = await User.find({}).sort({ createdAt: "-1" })
  return res.render("admin/allData", { user })
})

// showing the transactionfailed users i mean they tried atleast.
router.get("/paymentstatus", async (req, res) => {
  const user = await User.find({ statusofPayment: true }).sort({
    createdAt: "-1",
  })
  if (!user.length) {
    req.flash("error", "No data is available for now, please check later.")
    return res.redirect(req.header("Referer") || "/admin")
  }
  return res.render("admin/paymentStatusofuser", { user })
})
module.exports = router

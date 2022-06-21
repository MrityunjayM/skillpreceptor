// this page is just for all the control of admin on transaction.
const express = require("express");
const router = express.Router();
const TransactionDetail = require("../models/transaction");
const { timingFormat } = require("../helper/date");
const PurchaseOfUser = require("../models/purchase_Schema");
const User = require("../models/user");
const {
  getMonthlySubscriber,
  getWeeklyDetail,
  getMonthlyDetail,
} = require("../helper/admin_middleware");
// /transactiondetail of every weekkkk they can check itt okay.
router.get("/weekly", async (req, res) => {
  const transactionDetail = await getWeeklyDetail();
  const users = await User.find({});
  const user = users.filter((e) => {
    return e.orderId != null;
  });
  return res.render("admin/weekly_data", { transactionDetail, user });
});
// /transactiondetail
router.get("/today", async (req, res) => {
  const dateNow = timingFormat(new Date());
  const transactionDetail = await PurchaseOfUser.find({
    date: dateNow.dateformattransaction,
  }).populate(["userId", "product"]);
  const users = await User.find({});
  const user = users.filter((e) => {
    return e.orderId != null;
  });
  return res.render("admin/today_data", { transactionDetail, user });
});

router.get("/monthly", async (req, res) => {
  const transactionDetail = await getMonthlyDetail();
  const users = await User.find({});
  const user = users.filter((e) => {
    return e.orderId != null;
  });
  return res.render("admin/monthly_data", { transactionDetail, user });
});
module.exports = router;

const express = require("express")
const User = require("../models/user")
const router = express.Router()
const wrapAsync = require("../controlError/wrapAsync.js")
const Department = require("../models/department")
// this model is just for storing purchased data from cart.
const PurchaseOfUser = require("../models/purchase_Schema")

// user dashboard
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const userdata = await User.findById(req.user._id)
    const industries = await Department.find({ visibilty: true }).sort("order")
    return res.render("userdashboard/dashboard", {
      title: userdata.firstname,
      userdata,
      industries,
      path: "dashboard",
    })
  })
)

// purchase historyyy
router.get(
  "/purchase_history",
  wrapAsync(async (req, res) => {
    const Total = 0
    const TotalPrice = 0
    let purchase_history = await PurchaseOfUser.find({
      userId: req.user._id,
    })
      .populate("product")
      .sort({ modifiedOn: "-1" })
    // res.send(purchase_history);
    res.render("userdashboard/purchasehistory", {
      title: "Purchase History",
      purchase_history,
      Total,
      TotalPrice,
      path: "purchase",
    })
  })
)

router.get(
  "/download/invoice/:orderId",
  wrapAsync(async (req, res) => {
    const { orderId } = req.params
    const purchase = await PurchaseOfUser.findById(orderId)
    const allPurchase = await PurchaseOfUser.find({
      orderId: purchase.orderId,
    }).populate(["userId", "product"])
    console.log(allPurchase)
    return res.render("invoice/index", {
      title: "Invoice",
      allPurchase,
      purchaseId: purchase.orderId,
    })
  })
)

router
  .route("/edit_profile")
  .get(
    wrapAsync(async (req, res) => {
      const { _id: userId } = req.user
      const userdata = await User.findById(userId)
      const industries = await Department.find({ visibilty: true }).sort(
        "order"
      )
      return res.render("userdashboard/editInfo", {
        title: "Edit Profile",
        userdata,
        industries,
        path: "dashboard",
      })
    })
  )
  .post(
    wrapAsync(async (req, res) => {
      const { _id: userId } = req.user
      const userdata = await User.findById(userId)
      const {
        firstname = userdata.firstname,
        lastname = userdata.lastname,
        phone = userdata.phone,
        address = userdata.address,
        company = userdata.company,
        jobtitle = userdata.jobtitle,
        industry = userdata.industry,
        country = userdata.country,
        state = userdata.state,
        zipcode = userdata.zipcode,
      } = req.body

      await userdata.update({
        firstname,
        lastname,
        phone,
        address,
        company,
        jobtitle,
        industry,
        country,
        state,
        zipcode,
      })
      // await userdata.save()
      req.flash("success", "Your details has been updated.")
      return res.status(200).redirect("/user/dashboard")
    })
  )

// my certificates.
router.get("/certificates", (req, res) =>
  res.render("userdashboard/certificates", {
    title: "Certificates",
    path: "certificates",
  })
)

// live credential.
router.get(
  "/live_credentials",
  wrapAsync(async (req, res) => {
    let purchase_history = (
      await PurchaseOfUser.find({
        userId: req.user._id,
      })
        .populate("product")
        .sort({ modifiedOn: "-1" })
    ).filter(({ product }) => product.status === "Live")
    res.render("userdashboard/live_credentials", {
      title: "Live Credentials",
      path: "live_credentials",
      purchase_history,
    })
  })
)

// recorded
router.get("/recorded", async (req, res) => {
  let purchase_history = (
    await PurchaseOfUser.find({
      userId: req.user._id,
    })
      .populate("product")
      .sort({ modifiedOn: "-1" })
  ).filter(({ product }) => product.status === "Recorded")
  res.render("userdashboard/recorded", {
    title: "Recorded",
    path: "recorded",
    purchase_history,
  })
})

module.exports = router

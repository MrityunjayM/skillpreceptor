const express = require("express")
const Webinar = require("../models/webinar.js")
const Purchase = require("../models/purchase")
const router = express.Router()
const wrapAsync = require("../controlError/wrapAsync.js")
const { upload } = require("../helper/multer")
const Department = require("../models/department")
const Portfolio = require("../models/portfolio.js")
const {
  timingFormat,
  addtimeinAmPmFormat,
  firsttwomonthfromnow,
} = require("../helper/date")
const { isAdmin } = require("../helper/middleware.js")

// add the first page detail of webinar.
router.get(
  "/",
  isAdmin,
  wrapAsync(async (req, res) => {
    const categories = await Department.find({}).sort("order")
    const portfolio = await Portfolio.find({}).sort("name")
    if (!portfolio) {
      req.flash("error", "First enter the detail of atleast one instructor")
      return res.redirect("/portfolio")
    }
    if (!categories) {
      req.flash("error", "First enter the field of market categories")
      return res.redirect("/admin/category")
    }
    return res.render("admin/webinar_detail_one", { categories, portfolio })
  })
)

// adding the first page of webinar form here in database.
router.post(
  "/",
  isAdmin,
  upload.single("image"),
  wrapAsync(async (req, res) => {
    const { webinartiming, time, title } = req.body
    const lastWebinar = await Webinar.find({})
    if (lastWebinar.length) {
      var id = lastWebinar[lastWebinar.length - 1].webinarId
    }
    req.body.title = title.trim()
    const newWebinar = new Webinar(req.body)
    const portfolio = await Portfolio.findOne({ name: req.body.name })
    newWebinar.portfolio = portfolio._id
    if (typeof req.file != "undefined") {
      newWebinar.image.filename = req.file.filename
    }
    if (!req.body.slug) {
      newWebinar.slug = req.body.seotitle
        .replace(/[^a-zA-Z0-9]/g, " ")
        .toLowerCase()
        .split(" ")
        .join("-")
    }
    if (req.body.slug) {
      newWebinar.slug = req.body.slug
        .replace(/[^a-zA-Z0-9]/g, " ")
        .toLowerCase()
        .split(" ")
        .join("-")
    }
    // now adding the webinar id,we will show that on user interface.
    // below line is just for showing special type of date format on frontend(for user purpose).
    if (webinartiming) {
      const dateformat = timingFormat(webinartiming)
      const datePattern = dateformat.givenDateShowpage
      newWebinar.showingDate = datePattern
      newWebinar.dateforSort = dateformat.monthandyear
    }
    // here I am basically entering the time of estern and western inside a webinar schema.
    if (time) {
      const timeinFormat = addtimeinAmPmFormat(time)
      newWebinar.addtimingineastern = timeinFormat.eastern
      newWebinar.addtiminginpacific = timeinFormat.pacific
    }
    newWebinar.webinarId = !id ? 108 : id + 1
    const newWebinarcollected = await newWebinar.save()
    req.session.newWebinarData = newWebinarcollected
    res.redirect("/webinar/moredetail")
  })
)
//moredetail pe koi ja hi nhi sakta if piche ka detail add nhi kiya hai..
// rendering the form of 2nd page of webinar.
router.get(
  "/moredetail",
  isAdmin,
  wrapAsync(async (req, res) => {
    const detailOfNew = req.session.newWebinarData
    res.render("admin/webinar_detail_two", { detailOfNew })
  })
)

// adding the 2nd page detail in databases.
router.post(
  "/moredetail/:id",
  isAdmin,
  wrapAsync(async (req, res) => {
    const { id: _id } = req.params
    const { advantageous, abouttopic, bestfor, agenda } = req.body
    await Webinar.findOneAndUpdate(
      { _id },
      { advantageous, abouttopic, bestfor, agenda }
    )
    // delete added-webinar from session
    delete req.session.newWebinarData
    await req.session.save()
    res.redirect("/admin")
  })
)
// all webinar and seminar route for user.
router.get(
  "/all",
  wrapAsync(async (req, res) => {
    const { categoryId = "", month = "", status = "" } = req.query
    let categoryList = categoryId.split("_")
    let categoryNames = []
    let selectedMonth = []
    let query = { visibility: true, types: "Webinar" }
    if (categoryId.length) {
      const categories = await Department.find({
        _id: { $in: categoryList },
      })
      categoryNames = categories.reduce(
        (cat, { nameofdepartment }) => [...cat, nameofdepartment],
        []
      )
      query.category = {
        $in: categoryNames,
      }
    }
    if (status.length) query.status = status

    if (month.length && typeof month == "string") {
      if (month === "current") {
        query.dateforSort = firsttwomonthfromnow().currentMonth
      }
      if (month === "next") {
        query.dateforSort = firsttwomonthfromnow().firstmonthfromnow
      }
      if (month === "nextofnext") {
        query.dateforSort = firsttwomonthfromnow().secondmonthfromnow
      }
      selectedMonth += month
    } else if (month.length) {
      let dateforSort = []
      if (month.includes("current")) {
        selectedMonth += month
        dateforSort = [...dateforSort, firsttwomonthfromnow().currentMonth]
      }
      if (month.includes("next")) {
        selectedMonth += month
        dateforSort = [...dateforSort, firsttwomonthfromnow().firstmonthfromnow]
      }
      if (month.includes("nextofnext")) {
        selectedMonth += month
        dateforSort = [
          ...dateforSort,
          firsttwomonthfromnow().secondmonthfromnow,
        ]
      }
      query.dateforSort = { $in: dateforSort }
    }

    const department = await Department.find({ visibility: true }).sort("order")
    // i want to ask ki what will be your order on the basis of sort.
    const allWebinar = await Webinar.find(query)
      .sort({
        status: "1",
        time: "1",
        webinartiming: "-1",
      })
      .populate("portfolio")
    // just for handling something.

    if (
      !allWebinar.length &&
      (categoryId.length || month.length || status.length)
    ) {
      req.flash("error", "No match found")
      return res.redirect("/webinar/all")
    }
    if (!allWebinar.length) {
      req.flash("error", "Product not availale")
      return res.redirect("/")
    }
    return res.render("allwebinar", {
      allWebinar,
      department,
      categoryNames,
      selectedMonth,
      title: "All Webinars",
    })
  })
)

// just view the detail route of any webinar or seminar.
router.get(
  "/:webinarId/:slug",
  wrapAsync(async (req, res) => {
    const { webinarId } = req.params
    const webinar = await Webinar.findOne({ webinarId }).populate("portfolio")
    var purchaseQuery = { for: "Webinar" }
    if (webinar.status === "Recorded")
      purchaseQuery = { for: "Webinar_Recorded" }

    const purchases = await Purchase.find(purchaseQuery).lean().sort("order")
    const webinars = (
      await Webinar.find({
        category: webinar.category,
        types: webinar.types,
        visibility: true,
        archive: false,
      })
        .populate("portfolio")
        .sort({ webinartiming: -1 })
    )
      .filter((doc) => !doc._id.equals(webinar._id))
      .slice(0, 4)

    if (!webinar?.visibility) {
      req.flash("error", "This webinar is not available.")
      return res.redirect("/webinar/all")
    }
    let renderData = {
      webinars,
      webinar,
      purchases,
      title: webinar?.seotitle,
    }
    req.session.backUrl = req.originalUrl
    if (webinar?.archive) renderData.error = "This product is unavailable."
    // payment options...
    res.render("nextdetailofwebinar", renderData)
  })
)

// serching of product.
router.post(
  "/search",
  wrapAsync(async (req, res) => {
    const department = await Department.find({}).sort("order")

    if (!req.body.courses) {
      req.flash("error", "No match found")
      return req.redirect("/")
    }

    str = '"' + req.body.courses + '"'
    str1 = "'" + str + "'"
    let searchedWebinar = []
    if (str1.trim().indexOf(" ") != -1) {
      searchedWebinar = await Webinar.find({
        $text: { $search: str1 },
      }).populate("portfolio")
      if (searchedWebinar.length > 0) {
        const allWebinar = searchedWebinar
        return res.render("allwebinar", { allWebinar, department })
      }
    }
    if (!searchedWebinar.length) {
      //create searching
      const allWebinar = await Webinar.find(
        { $text: { $search: req.body.courses } },
        { score: { $meta: "textScore" } }
      )
        .populate("portfolio")
        .sort({ score: { $meta: "textScore" } })

      if (allWebinar.length) {
        return res.render("allwebinar", {
          allWebinar,
          department,
          categoryList: [],
        })
      }
    }

    req.flash("error", "No match found.")
    return res.status(200).redirect(req.header("Referer"))
  })
)

module.exports = router

const router = require("express").Router()
const Webinar = require("../models/webinar.js")
const Department = require("../models/department")
const Purchase = require("../models/purchase")

const wrapAsync = require("../controlError/wrapAsync")

router.get(
  "/all",
  wrapAsync(async (req, res) => {
    const { categoryId = "", month = "", status = "" } = req.query
    let categoryList = categoryId.split("_"),
      categoryNames = []
    let query = { visibility: true, types: "Seminar", status: "Live" }
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

    const department = await Department.find({}).sort("order")
    // i want to ask ki what will be your order on the basis of sort.
    const allWebinar = await Webinar.find(query)
      .sort({
        status: "1",
        time: "1",
        webinartiming: "-1",
      })
      .populate("portfolio")

    // added by me.
    if (!allWebinar.length) {
      req.flash(
        "error",
        "We haven't added product,explore other section for now"
      )
      return res.redirect("/")
    }
    // just for handling something.

    if (!allWebinar.length) {
      req.flash("error", "No match found")
      return res.redirect("/webinar/all")
    }
    return res.render("allwebinar", {
      title: "All Catalog",
      allWebinar,
      department,
      categoryNames,
    })
  })
)

// home page category route all data webinar and seminar.
router.get("/webinar", async (req, res) => {
  const { categoryId } = req.query
  const { nameofdepartment } = await Department.findById(categoryId)
  const allWebinar = await Webinar.find({
    category: nameofdepartment,
  })
    .populate("portfolio")
    .sort({ webinartiming: "-1" })
  return res.render("industries", {
    title: nameofdepartment,
    allWebinar,
  })
})

// route for show-page.
router.get("/s/:id/:slug", async (req, res) => {
  const { agenda = false } = req.query
  const purchases = await Purchase.find({ for: "Seminar" }).sort("order")
  const seminar = await Webinar.findById(req.params.id).populate("portfolio")
  const seminars = (
    await Webinar.find({
      category: seminar.category,
      types: seminar.types,
      visibility: true,
      archive: false,
    })
      .populate("portfolio")
      .sort({ webinartiming: -1 })
  ).slice(0, 4)

  if (!seminar?.visibility) {
    req.flash("error", "This webinar is not available.")
    return res.redirect("/seminar/all")
  }
  let renderData = {
    seminars,
    seminar,
    purchases,
    agenda,
    title: seminar.seotitle,
  }
  req.session.backUrl = req.originalUrl
  if (seminar.archive) renderData.error = "This product is unavailable."
  return res.status(200).render("seminar", renderData)
})

module.exports = router

const router = require("express").Router()
const Cart = require("../models/cart")
const User = require("../models/user.js")
const Purchase = require("../models/purchase")
const Webinar = require("../models/webinar.js")
const Category = require("../models/department")
const Portfolio = require("../models/portfolio.js")
const ContactForm = require("../models/contactform")

const { upload } = require("../helper/multer")
const wrapAsync = require("../controlError/wrapAsync")
const { timingFormat, addtimeinAmPmFormat } = require("../helper/date")

const {
  getTodayRevenue,
  getMonthlyRevenue,
  getWeeklyRevenue,
  getMonthlySubscriber,
} = require("../helper/admin_middleware")

//its admin dashboard route.
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const todayRevenue = await getTodayRevenue()
    const weeklyRevenue = await getWeeklyRevenue()
    const monthlyRevenue = await getMonthlyRevenue()
    const monthlySubscriber = (await getMonthlySubscriber()).length
    const leads = await ContactForm.find({}).sort({ date: -1 })

    const todayRevenueAmount = todayRevenue.reduce(
      (acc, { amount }) => acc + amount,
      0
    )
    const weeklyRevenueAmount = weeklyRevenue.reduce(
      (acc, { amount }) => acc + amount,
      0
    )
    const monthlyRevenueAmount = monthlyRevenue.reduce(
      (acc, { amount }) => acc + amount,
      0
    )

    res.render("admin/dashboard", {
      leads,
      todayRevenueAmount,
      weeklyRevenueAmount,
      monthlyRevenueAmount,
      monthlySubscriber,
    })
  })
)
// all listed webinar
router.get(
  "/allproduct",
  wrapAsync(async (req, res) => {
    const webinar = await Webinar.find({ archive: false }).sort({
      webinartiming: -1,
    })
    if (!webinar) {
      req.flash("error", "First Enter the detail of webinar.")
      return res.redirect("/webinar")
    }
    return res.render("admin/listedproduct", { webinar })
  })
)
//getting edit form for webinar
router.get(
  "/edit_product/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params
    const webinar = await Webinar.findById(id)
    //below line is to entering the date inside form basically we are extracting the date.
    const dateformat = timingFormat(webinar.webinartiming)
    const datePattern = dateformat.datePattern
    const categories = await Category.find({}).sort("order")
    const portfolio = await Portfolio.find({}).sort("name")
    res.render("admin/editlistedproduct", {
      webinar,
      categories,
      portfolio,
      datePattern,
    })
  })
)
// webinar or seminar get updated with this route..
router.put(
  "/edit_product/:id",
  upload.single("image"),
  wrapAsync(async (req, res) => {
    const { time, webinartiming } = req.body
    const { id } = req.params
    const webinar = await Webinar.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    })
    if (typeof req.file != "undefined") {
      webinar.image.filename = req.file.filename
    }
    if (!req.body.slug) {
      webinar.slug = req.body.seotitle
        .replace(/[^a-zA-Z0-9]/g, " ")
        .toLowerCase()
        .split(" ")
        .join("-")
    }
    if (req.body.slug) {
      webinar.slug = req.body.slug
        .replace(/[^a-zA-Z0-9]/g, " ")
        .toLowerCase()
        .split(" ")
        .join("-")
    }
    if (time) {
      const timeinFormat = addtimeinAmPmFormat(time)
      webinar.addtimingineastern = timeinFormat.eastern
      webinar.addtiminginpacific = timeinFormat.pacific
    }
    if (webinartiming) {
      const dateformat = timingFormat(webinartiming)
      const datePattern = dateformat.givenDateShowpage
      webinar.showingDate = datePattern
      webinar.dateforSort = dateformat.monthandyear
    }
    webinar.category = req.body.nameofdepartment
    await webinar.save()
    res.redirect("/admin/allproduct")
  })
)

//updating the visibility of webinar or seminar page.
router.get("/update_the_visibility/:id", async (req, res) => {
  const { id } = req.params
  const webinartoupdate = await Webinar.findById(id)
  await Webinar.findByIdAndUpdate(
    id,
    {
      visibility: !webinartoupdate.visibility,
    },
    {
      runValidators: true,
      new: true,
    }
  )
  // here I am updating visibility cart model for those product that is selected by visibility to true or false.
  await Cart.find({ product: id }).updateMany(
    {},
    { visibility: !webinartoupdate.visibility }
  )
  return res.redirect("/admin/allproduct")
})

//deleting or archiving webinar page;
router.get(
  "/delete_product/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params
    const { archive, restore } = req.query
    if (restore) {
      await Webinar.findByIdAndUpdate(
        id,
        {
          archive: false,
        },
        {
          runValidators: true,
          new: true,
        }
      )
      return res.redirect("/admin/allproduct")
    }
    if (archive) {
      await Webinar.findByIdAndUpdate(
        id,
        {
          archive: true,
        },
        {
          runValidators: true,
          new: true,
        }
      )
      return res.redirect("/admin/allproduct")
    }
    await Webinar.findByIdAndDelete(id)
    req.flash("success", "Webinar Deleted")
    res.redirect("/admin/allproduct")
  })
)
// archive product
router.get("/archive", async (req, res) => {
  const archive = await Webinar.find({ archive: true })
  res.render("admin/archive", { archive })
})

// category or say industry adding page.
router.get(
  "/category",
  wrapAsync(async (req, res) => {
    res.render("admin/add_category")
  })
)
// adding industry in database.
router.post(
  "/add-category",
  wrapAsync(async (req, res) => {
    const newCategory = new Category(req.body)
    await newCategory.save()
    res.redirect("/admin/allcategories")
  })
)
// from here we can see all category page.
router.get(
  "/allcategories",
  wrapAsync(async (req, res) => {
    const category = await Category.find({}).sort("order")
    res.render("admin/allcategory", { category })
  })
)

// by this route we are rendering edit form of industry.
router.get(
  "/edit_category/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params
    const category = await Category.findById(id)
    res.render("admin/editcategory", { category })
  })
)
// this will add edited category in database.

router.put(
  "/category/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params
    await Category.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    })

    req.flash("success", "category updated")
    res.redirect("/admin/allcategories")
  })
)
// deleting the category as we want.
router.get(
  "/delete_category/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params
    await Category.findByIdAndDelete(id)
    req.flash("success", "category deleted")
    res.redirect("/admin/allcategories")
  })
)
// for ups and down.
router.get(
  "/upanddownthe_category/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params
    let { action, position } = req.query
    position = parseInt(position)
    const categories = await Category.find({}).sort("order")
    let [selectedCategory] = categories.filter((doc) => doc._id.equals(id))
    const index = categories.indexOf(selectedCategory)
    console.log(index)
    if (action == 1 && categories[0].order == position) {
      req.flash(
        "error",
        "you can't up the category which is on topmost position."
      )
      return res.redirect("/admin/allcategories")
    }
    if (action == -1 && position == categories[categories.length - 1].order) {
      req.flash(
        "error",
        "you can't down the category that is on last position."
      )
      return res.redirect("/admin/allcategories")
    }
    if (action == 1) {
      var lastindexorder = categories[index - 1].order
    }
    if (action == -1) {
      var nextindexorder = categories[index + 1].order
    }
    var query =
      action == 1
        ? { $or: [{ order: position }, { order: lastindexorder }] }
        : { $or: [{ order: position }, { order: nextindexorder }] }
    const categoryList = await Category.find(query)
    ;[categoryList[0].order, categoryList[1].order] = [
      categoryList[1].order,
      categoryList[0].order,
    ]
    await categoryList[0].save()
    await categoryList[1].save()

    return res.redirect("/admin/allcategories")
  })
)

//updating the visibility of Category or say type of market.
router.get("/update_the_visibility_of_category/:id", async (req, res) => {
  const { id } = req.params
  const categorytoupdate = await Category.findById(id)
  // updating the category.
  await Category.findByIdAndUpdate(
    id,
    {
      visibility: !categorytoupdate.visibility,
    },
    {
      runValidators: true,
      new: true,
    }
  )
  //once the category is updating we have to update all the product with that category with the visibility thing
  await Webinar.find({
    category: categorytoupdate.nameofdepartment,
  }).updateMany({}, { visibility: !categorytoupdate.visibility })
  return res.redirect("/admin/allcategories")
})
// finding all the data of cart with every users
router.get("/cartdata_to_no_purchase", async (_, res) => {
  const user = await User.find({}).populate("cart")
  return res.render("admin/cartAbandon", { user })
})
// Searching product
router.post(
  "/listedproductsearching",
  wrapAsync(async (req, res) => {
    if (!req.body.product) {
      req.flash(
        "error",
        "Oops!! Looks-like you haven't entred any value for search"
      )
      return res.redirect("/admin/allproduct")
    }
    str = '"' + req.body.product + '"'
    str1 = "'" + str + "'"

    let searchedWebinar = []
    if (str1.trim().indexOf(" ") != -1) {
      searchedWebinar = await Webinar.find({
        $text: { $search: str1 },
      })
      if (searchedWebinar.length > 0) {
        const webinar = searchedWebinar
        return res.render("admin/listedproduct", { webinar })
      }
    }
    if (!searchedWebinar.length) {
      //create searching
      const webinar = await Webinar.find(
        { $text: { $search: req.body.product } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } })

      if (webinar.length) {
        return res.render("admin/listedproduct", { webinar })
      }
    }
    req.flash("error", "No match found")
    return res.redirect("/admin/allproduct")
  })
)

// product page for admin
router.get(
  "/product/:id",
  wrapAsync(async (req, res, next) => {
    let { agenda = false } = req.query
    const { id: productId } = req.params
    const seminar = await Webinar.findById(productId).populate("portfolio")
    const purchases = await Purchase.find({ for: seminar.types })
    agenda = seminar.types == "Seminar" && agenda ? true : false
    // return res.json({ seminar, purchase })
    return res.render("seminar", { seminars: [], seminar, purchases, agenda })
  })
)

module.exports = router

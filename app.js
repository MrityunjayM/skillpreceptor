if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}
const express = require("express")
const path = require("path")
const compression = require("compression")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoDBStore = require("connect-mongo")
const flash = require("connect-flash")
const methodOverride = require("method-override")
const passport = require("passport")
const LocalStrategy = require("passport-local")

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/project-banglore"
// const dbUrl =
//   "mongodb+srv://admin1:XJe8Rvq0nlQvGL9X@example1.9cdlb.mongodb.net/bngproject?retryWrites=true&w=majority"
const Department = require("./models/department")
const Instructor = require("./models/portfolio")
const WebinarModel = require("./models/webinar.js")
const User = require("./models/user")

const Lead = require("./routes/lead")
const Cart = require("./routes/cart")
const Seminar = require("./routes/seminar")
const Portfolio = require("./routes/portfolio")
const AddPrice = require("./routes/add_price")
const Webinar = require("./routes/detailofwebinar")
const NewsLetter = require("./routes/news_letter")
const UserRoute = require("./routes/user")
const Payment = require("./routes/payment")
const Coupon = require("./routes/coupon_code")
const AdminDashboard = require("./routes/admin_dashboard")
const UserDashboard = require("./routes/user_dashboard")
const Training = require("./routes/training")
const CustomerFeedback = require("./routes/customer-feedback")
const TransactionDetail = require("./routes/transation_control_admin")
const Industry = require("./routes/industry")

const AppError = require("./controlError/AppError")
const wrapAsync = require("./controlError/wrapAsync")
// Auth Middleware
const { isLoggedIn, isAdmin } = require("./helper/middleware")

mongoose
  .connect(dbUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connection open")
  })
  .catch((err) => {
    console.error(err)
  })

const app = express()

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(__dirname + "/public"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(compression())
app.use(methodOverride("_method"))
app.use(
  "/tinymce",
  express.static(path.join(__dirname, "node_modules", "tinymce"))
)

const store = new MongoDBStore({
  mongoUrl: dbUrl,
  secret: "thisshouldbeabettersecret!",
  touchAfter: 60,
})

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
  store,
  secret: "thisshouldbeabettersecret!",
  name: "balajee",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
  // idforuser: id_generator(),
}

app.use(session(sessionConfig))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    User.authenticate()
  )
)
passport.serializeUser(function (user, done) {
  done(null, user)
})
passport.deserializeUser(function (user, done) {
  done(null, user)
})

app.use(async (req, res, next) => {
  res.locals.currentUser = req.user
  res.locals.cartCount = req.session.count
  res.locals.error = req.flash("error")
  res.locals.success = req.flash("success")
  res.locals.captcha_error = req.flash("captcha_error")

  // setting departments into local var for displaying on navbar
  res.locals.inds = await Department.find({ visibility: true }).sort("order")

  next()
})
// Routes...
app.use("/webinar", Webinar)
app.use("/seminar", Seminar)
app.use("/portfolio", isAdmin, Portfolio)
app.use("/admin", isAdmin, AdminDashboard)
app.use("/price", isAdmin, AddPrice)
app.use("/cart", Cart)
app.use("/user", UserRoute)
app.use("/user/dashboard", isLoggedIn, UserDashboard)
app.use("/payment", isLoggedIn, Payment)
app.use("/newsletter", NewsLetter)
app.use("/transactiondetail", isAdmin, TransactionDetail)
app.use("/customer-feedback", CustomerFeedback)
app.use("/training", Training)
app.use("/category", Industry)
app.use("/admin/lead", isAdmin, Lead)
app.use("/coupon", isAdmin, Coupon)

// Home route
app.get(
  "/",
  wrapAsync(async (req, res) => {
    const webinars = (
      await WebinarModel.find({ visibility: true, status: "Live" })
        .populate("portfolio")
        .sort({ webinartiming: "-1" })
    ).slice(0, 8)
    const departments = await Department.find({ visibility: true })
    const instructors = await Instructor.find({ visibility: true })
    return res.render("home", {
      departments: departments.slice(
        0,
        (departments.length < 3 ? 3 : departments.length / 3) * 3
      ),
      webinars,
      instructors,
      title: "Welcome",
    })
  })
)

// static pages...
app.get("/faqs", (_, res) => res.render("faqs", { title: "FAQ's" }))
app.get("/termsofservice", (_, res) =>
  res.render("termsOfService", { title: "Terms of Service" })
)
app.get("/privacy_policy", (_, res) =>
  res.render("privacyPolicy", { title: "Privacy Policy" })
)
app.get("/refund_policy", (_, res) =>
  res.render("refundPolicy", { title: "Refund Policy" })
)
app.get("/aboutus", (_, res) => res.render("aboutUs", { title: "About Us" }))
app.get("/contact", (_, res) => res.render("contactUs", { title: "Contact" }))

// Redirect routes
app.get("/home", (_, res) => res.redirect("/"))
app.get("/user", (_, res) => res.redirect("/user/dashboard"))
app.get("/login", (_, res) => res.redirect("/user/login"))
app.get("/forgetpassword", (_, res) => res.redirect("/user/forgetpassword"))
app.get("/logout", (_, res) => res.redirect("/user/logout"))
app.get("/register", (_, res) => res.redirect("/user/register"))

const handleValidationErr = (err) => {
  return new AppError("Please fill up all the required field carefully", 550)
}

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    err = handleValidationErr(err)
    req.flash("error", err.message)
    return res.redirect(req.header("Referer") || "/")
  }
  if (err.name === "MongoServerError") {
    req.flash(
      "error",
      "You can't give the same title to two different products."
    )
    return res.redirect(req.header("Referer") || "/")
  }
  return next(err)
})

app.use((err, req, res, next) => {
  if (err && err.status == 555) {
    req.flash("error", err.message)
    return res.redirect(req.header("Referer") || "/")
  }
  if (err && err.status == 400) {
    req.flash("error", err.message)
    return res.redirect(req.header("Referer") || "/")
  }
  return next(err)
})

// this is for handling unexpected
app.use((err, req, res, next) => {
  if (err) {
    console.log(err, "Error Unhandeled")
    req.flash("error", "Something went wrong, please try later.")
    return res.redirect(req.header("Referer") || "/")
  }
})

app.get("*", (_, res) =>
  res.render("404", { msg: "Page not found", err: { status: 404 } })
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("APP IS LISTENING ON PORT " + PORT))

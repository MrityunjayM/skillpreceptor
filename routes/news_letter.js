const router = require("express").Router()
const Email = require("../models/newsLetter")

const wrapAsync = require("../controlError/wrapAsync")
const { timingFormat } = require("../helper/date")

// adding new user for newsLetter.
router.post(
  "/subscribe",
  wrapAsync(async (req, res) => {
    const { email } = req.body
    const dateNow = timingFormat(new Date())
    const newUser = new Email({
      email: email,
      date: dateNow.dateformattransaction,
    })
    await newUser.save()
    if (!newUser) {
      throw new AppError("Something going wrong", 404)
    }
    req.flash("success", "Thanks for subscribing our news letter.")
    return res.redirect("/")
  })
)

// route if someone will unsubscribe us.
router
  .route("/unsubscribe")
  .get((_, res) => res.render("unsubscribe", { title: "Unsubscribe" }))
  .post(
    wrapAsync(async (req, res) => {
      const { email } = req.body
      const userforunsubscribe = await Email.findOne({ email: email })
      userforunsubscribe.subscribed = false
      await userforunsubscribe.save()
      if (!userforunsubscribe) {
        throw new AppError("Something going wrong,please try again.", 404)
      }
      req.flash("error", "you won't get any mails anymore.")
      return res.redirect("/")
    })
  )

module.exports = router

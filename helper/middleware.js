const { default: axios } = require("axios")

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl
    req.flash("error", "You are not LoggedIn!")
    return res.redirect("/login")
  }
  next()
}

module.exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.admin == true) {
    next()
  } else {
    req.flash("error", "Access Denied")
    res.redirect("/user/login")
    // res.redirect('/users/login');
  }
}

// Google reCaptcha Verification
module.exports.verifyCaptcha =
  (req, res) =>
  async ({ path = "home", detail = {}, redirect = false }) => {
    const captcha_response = req.body["g-recaptcha-response"]
    const verificaton_url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${captcha_response}`

    const { data } = await axios.post(verificaton_url)
    if (!data.success && redirect) {
      req.flash("captcha_error", "Captcha validation Failed")
      return res.redirect(req.header("Referer") || "/")
    } else if (!data.success) {
      return res.status(400).render(path, {
        ...detail,
        captcha_error: "Captcha validation failed.",
      })
    }
    return 0
  }

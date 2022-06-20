const router = require("express").Router()

router.get("/", (req, res) =>
  res.status(200).render("training", { title: "Consult with Us" })
)

module.exports = router

const router = require("express").Router()
const Portfolio = require("../models/portfolio")
const Webinar = require("../models/webinar")

const wrapAsync = require("../controlError/wrapAsync")

router.get(
  "/:instructorId",
  wrapAsync(async (req, res) => {
    const { instructorId } = req.params
    const instructor = await Portfolio.findById(instructorId).lean()
    const webinars = await Webinar.find({
      portfolio: instructorId,
      visibilty: true,
      archive: false,
    }).lean()

    return res.render("instructor", {
      instructor,
      webinars,
      title: instructor.name,
    })
  })
)

module.exports = router

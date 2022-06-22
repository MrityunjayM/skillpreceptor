const router = require("express").Router()
const Department = require("../models/department")
const Webinar = require("../models/webinar")

const wrapAsync = require("../controlError/wrapAsync")

router.get(
  "/",
  wrapAsync(async (req, res) => {
    const { industryId } = req.query
    const { nameofdepartment } = await Department.findById(industryId)
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
)

module.exports = router

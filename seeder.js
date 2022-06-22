const Webinar = require("./models/webinar")
const { generateString } = require("./helper/string_generator")
const Department = require("./models/department")
const Portfolio = require("./models/portfolio")
const mongoose = require("mongoose")
const dbUrl = process.env.DB_URL

const str = `Lorem ipsum dolor sit amet consectetur adipisicing elit.
            Perferendis, temporibus, id iure minima, harum laboriosam
            ut eligendi facere iste error autem quibusdam doloremque itaque 
            ducimus maxime aliquid. Cupiditate, dolorem asperiores!
            `
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

let id = 0
async function seedDB(types = "Webinar", status = "Live") {
  const department = await Department.find({})
  const portfolio = await Portfolio.find({})
  const d = Math.floor(Math.random() * department.length)

  for (let i = 0; i < 5; i++) {
    id += i
    const hello = {
      webinarId: 108 + id,
      name: portfolio[i % 2].name,
      title: generateString(100),
      category: department[d].nameofdepartment,
      description: str,
      about: str,
      duration: 90,
      time: `12:40`,
      agenda: str,
      types,
      webinartiming: new Date(),
      status,
      bestfor: str,
      advantageous: str,
      abouttopic: str,
      seotitle: "mrityunjay",
      slug: "mrityunjay-testing",
      portfolio: portfolio[i % 2]._id,
      visibility: true,
      archive: false,
    }
    const h = new Webinar(hello)
    await h.save()
  }
}
seedDB("Webinar", "Recorded")
seedDB("Seminar", "Recorded")
seedDB("Seminar", "Live")
seedDB().then(() => process.exit(0))

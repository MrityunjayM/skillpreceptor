const Webinar = require("./models/webinar")
const { generateString } = require("./helper/string_generator")
const Department = require("./models/department")
const Portfolio = require("./models/portfolio")
const mongoose = require("mongoose")
const dbUrl = process.env.MONGO_DB_LOCAL

const str = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis, temporibus, id iure minima, harum laboriosam
    ut eligendi facere iste error autem quibusdam doloremque itaque ducimus maxime aliquid. Cupiditate, dolorem
    asperiores!`
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

async function seedDB(types = "Webinar", status = "Live") {
  const department = await Department.find({})
  const portfolio = await Portfolio.find({})
  const d = Math.floor(Math.random() * department.length)
  const p = Math.floor(Math.random() * portfolio.length)

  for (let i = 0; i < 21; i++) {
    const hello = {
      name: portfolio[0].name,
      title: generateString(6),
      category: department[d].nameofdepartment,
      description: str,
      about: str,
      image: {
        url: "https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      },
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
      portfolio: portfolio[p]._id,
      visibility: true,
    }
    const h = new Webinar(hello)
    await h.save()
  }
}
seedDB("Webinar", "Recorded")
seedDB("Seminar", "Recorded")
seedDB("Seminar", "Live")
seedDB().then(() => process.exit(0))

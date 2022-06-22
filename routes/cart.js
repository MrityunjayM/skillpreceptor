const express = require("express")
const Purchase = require("../models/purchase")
const Cart = require("../models/cart.js")
const router = express.Router()
const AppError = require("../controlError/AppError")
const wrapAsync = require("../controlError/wrapAsync")
const User = require("../models/user.js")
const { isLoggedIn } = require("../helper/middleware")

router.get(
  "/checkout",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { _id: userId } = req.user
    const cart = await Cart.find({ userId }).populate(["userId", "product"])
    let total = cart.reduce((acc, { categoryofprice }) => {
      return (
        acc +
        categoryofprice.reduce((itemTotal, { price, quantity }) => {
          return itemTotal + price * quantity
        }, 0)
      )
    }, 0)

    if (req.session.discountinprice) {
      total = total - req.session.discountinprice
    } else if (req.session.discountinpercentage) {
      total = total - total * (req.session.discountinpercentage / 100)
    }

    return res.status(200).render("checkout", {
      title: "Checkout",
      cart,
      total: total.toFixed(2),
      userdata: cart[0].userId,
    })
  })
)

// adding cart for a user in the database........
router.post(
  "/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params
    const { purchasecategory } = req.body
    //finding on the basis of Purchase model.
    const purchase = await Purchase.findOne({
      nameofpurchase: purchasecategory,
    })
    const price = purchase.price
    var query = {}
    if (req.user) {
      query = { userId: req.user._id, product: id }
    }
    if (!req.user) {
      query = { cartSessionId: req.sessionID, product: id }
    }
    const cart = await Cart.findOne(query)
    //cart existing and product selected is also existing in that case.
    // to compare productId, 'equals()', method should be called.
    if (cart && cart.product == id) {
      const hi = cart.categoryofprice.filter((e) => price == e.price)
      //if product exist  but not from the same product category then we are adding that one.
      if (hi.length == 0) {
        cart.categoryofprice = [
          ...cart.categoryofprice,
          {
            quantity: 1,
            price: price,
            totalPrice: price,
            name: purchasecategory,
          },
        ]
        await cart.save()
      }
      //in case if product of same category already existed.
      if (hi.length > 0) {
        const idof_category = hi[0]._id
        // if selected product is of same category as delected by before.
        Cart.updateOne(
          { "categoryofprice._id": idof_category },
          {
            $set: {
              "categoryofprice.$.quantity": hi[0].quantity + 1,
              // "categoryofprice.$.price": (e.quantity + 1) * e.price,
              "categoryofprice.$.totalPrice":
                (hi[0].quantity + 1) * hi[0].price,
            },
          },
          (err, model) => {
            if (err) {
              req.flash("error", "Something went wrong...")
              return res.redirect(req.header("Referer"))
            }
          }
        )
      }
    }

    if (!cart) {
      var newCart = new Cart({
        userId: req.user ? req.user._id : null,
        cartSessionId: req.sessionID,
        product: req.params.id,
        categoryofprice: [
          {
            quantity: 1,
            price: price,
            totalPrice: price,
            name: purchasecategory,
          },
        ],
      })
      await newCart.save()
      if (req.user) {
        const user = await User.findOne({ _id: req.user._id })
        user.cart = newCart._id
        await user.save()
      }
    }
    // req.session.count = cart ? cart.length : newCart.length
    return res.redirect("/cart/all")
  })
)
// finding all the cart associated with user and clearing too if they choose so.
router.get(
  "/all",
  wrapAsync(async (req, res) => {
    const { clear, id } = req.query
    const Total = 0
    const TotalPrice = 0
    // adding the new line of code here.
    const discountinprice = req.session.discountinprice
    const discountinpercentage = req.session.discountinpercentage
    // basically passing query because we need the data of cart which having visibility of true.
    let query1 = { cartSessionId: req.sessionID, visibility: true }
    var cart = await Cart.find(query1).populate("product")
    req.session.count = cart.length
    await req.session.save()
    if (cart.length && req.user) {
      await Cart.find(query1).updateMany({}, { userId: req.user._id })
    }

    // clear if already logged in.
    if (clear && req.user) {
      if (req.session.discountinprice) {
        delete req.session.discountinprice
        // console.log("lets,see 1", req.session.discountinprice)
      }
      if (req.session.discountinpercentage) {
        delete req.session.discountinpercentage
        // console.log("lets,see 2", req.session.discountinpercentage)
      }
      delete req.session.count
      await req.session.save()
      // await Cart.findOneAndDelete({ userId: req.user._id });
      await Cart.deleteMany({ userId: req.user._id })
      cart = []
      return res.render("cart", {
        title: "Cart",
        cart,
        Total,
        TotalPrice,
        discountinpercentage,
        discountinprice,
        cartCount: cart.length,
      })
    }

    if (clear && !req.user) {
      if (req.session.discountinprice) {
        delete req.session.discountinprice
      }

      if (req.session.discountinpercentage) {
        delete req.session.discountinpercentage
      }
      delete req.session.count
      await req.session.save()
      await Cart.deleteMany({ cartSessionId: req.sessionID })
      cart = []
      return res.render("cart", {
        title: "Cart",
        cart,
        Total,
        TotalPrice,
        discountinpercentage,
        discountinprice,
        cartCount: cart.length,
      })
    }

    if (id || req.user) {
      var userid = id ? id : req.user._id
      let query2 = { userId: userid, visibility: true }
      var cart = await Cart.find(query2).populate("product")
      req.session.count = cart.length
      await req.session.save()
      return res.render("cart", {
        title: "Cart",
        cart,
        Total,
        TotalPrice,
        discountinpercentage,
        discountinprice,
        cartCount: cart.length,
      })
    }

    return res.render("cart", {
      title: "Cart",
      cart,
      Total,
      TotalPrice,
      discountinpercentage,
      discountinprice,
      cartCount: cart.length,
    })
  })
)
// increasing decresing the product category inside cart.
router.get(
  "/:cartId/:categoryId",
  wrapAsync(async (req, res, next) => {
    const { cartId, categoryId } = req.params
    const { action } = req.query
    let query = null
    // passed query if user is logged in.
    if (req.user) {
      query = { userId: req.user._id, _id: cartId }
    }
    // passing the query if no user is there that means finding with session id.
    if (!req.user) {
      query = { cartSessionId: req.sessionID, _id: cartId }
    }
    const cart = await Cart.findOne(query)
    const [selectedProduct] = cart.categoryofprice.filter((doc) =>
      doc._id.equals(categoryId)
    )
    // delete all cart if there is only one item left in the cart
    if (
      cart.categoryofprice.length === 1 &&
      selectedProduct.quantity === 1 &&
      action == -1
    ) {
      await cart.delete()
      return res.status(200).redirect("/cart/all")
    }
    // remove selectedProdect if there is only one product of that priceCategory
    if (selectedProduct.quantity === 1 && action == -1) {
      indexOfSelectedProduct = cart.categoryofprice.indexOf(selectedProduct)
      cart.categoryofprice = cart.categoryofprice.splice(
        indexOfSelectedProduct,
        1
      )
      await cart.save()
      return res.status(200).redirect("/cart/all")
    }
    // increment or decrement the count of cart product
    Cart.updateOne(
      { "categoryofprice._id": categoryId },
      {
        $set: {
          "categoryofprice.$.quantity":
            selectedProduct.quantity + parseInt(action),
          "categoryofprice.$.totalPrice":
            (selectedProduct.quantity + parseInt(action)) *
            selectedProduct.price,
        },
      },
      {},
      (err, model) => {
        if (err) return next(err)
      }
    )

    return res.status(200).redirect("/cart/all")
  })
)

router.post(
  "/edit/profile",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    console.log("hello world balajee")
    const { _id: userId } = req.user
    const userdata = await User.findById(userId)
    const {
      firstname = userdata.firstname,
      lastname = userdata.lastname,
      phone = userdata.phone,
      address = userdata.address,
      company = userdata.company,
      jobtitle = userdata.jobtitle,
      industry = userdata.industry,
      country = userdata.country,
      state = userdata.state,
      zipcode = userdata.zipcode,
    } = req.body

    await userdata.update({
      firstname,
      lastname,
      phone,
      address,
      company,
      jobtitle,
      industry,
      country,
      state,
      zipcode,
    })
    // await userdata.save()
    req.flash("success", "Your details has been updated.")
    return res.status(200).redirect("/cart/checkout")
  })
)

module.exports = router

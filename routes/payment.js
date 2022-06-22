const router = require("express").Router()
const Cart = require("../models/cart")
const Coupon = require("../models/coupon_code")
const wrapAsync = require("../controlError/wrapAsync")
const paypal = require("paypal-rest-sdk")
const { isSuccess } = require("../helper/successtransaction_middleware")
const User = require("../models/user")

const YOUR_DOMAIN = process.env.YOUR_DOMAIN || "http://test.mrityunjay.com:5000"
//stripe credential.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
//paypal credential.
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
})

// checking if a user got a coupone code.
router.get("/haveaCouponecode", (req, res) =>
  res.render("haveaCouponecode", { title: "Apply coupon code" })
)

// checking whether the user entering the right coupon code or not.
router.post(
  "/haveaCouponecode",
  wrapAsync(async (req, res) => {
    const { coupon } = req.body
    const [matchingtheCouponCode] = await Coupon.find({ coupon })
    // console.log(matchingtheCouponCode)
    if (matchingtheCouponCode) {
      req.session.discountinpercentage =
        matchingtheCouponCode.discountinpercentage
      req.session.discountinprice = matchingtheCouponCode.discountinprice
      return res.redirect("/cart/all")
    }
    return res.redirect("/payment/haveaCouponecode")
  })
)
// payment with stripe input form.
router.get(
  "/paymentwithstripe",
  wrapAsync(async (req, res) => {
    let cart = await Cart.find({ userId: req.user._id }).populate("product")
    let total = cart.reduce(
      (acc, item) =>
        item.reduce(
          (itemTotal, { categoryofprice }) =>
            itemTotal + categoryofprice.totalPrice,
          acc
        ),
      0
    )
    if (req.session.discountinprice) {
      total = total - req.session.discountinprice
    }
    if (req.session.discountinpercentage) {
      total = total - total * (req.session.discountinpercentage / 100)
    }
    res.render("checkout", {
      title: "Payment with Stripe",
      cart,
      total: total.toFixed(2),
    })
  })
)

// payment with stripe processing
router.post(
  "/paymentwithstripe/checkout",
  wrapAsync(async (req, res) => {
    // storing session here so that we can store the amount in success route.

    const { address, phone, country, state, jobtitle, zipcode } = req.user
    if (address && phone && country && state && jobtitle && zipcode) {
      req.session.amount = req.body.totalprice
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: req?.user?.firstname || "" + req?.user?.lastname || "",
              },
              unit_amount: req.body.totalprice * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${YOUR_DOMAIN}/payment/success`,
        cancel_url: `${YOUR_DOMAIN}/payment/canceltransaction`,
      })
      res.redirect(303, session.url)
    } else {
      req.flash("error", "Please enter all your detail first")
      return res.redirect("/cart/checkout")
    }
  })
)

// success route of payment with stripe processing
router.get(
  "/success",
  wrapAsync(async (req, res, next) => {
    //new added code.
    if (req.session.amount) {
      req.session.method = "Stripe"
      isSuccess(req, res, next)
    }
    // payment status -> success
    const updatingTheUser = await User.findOne({ _id: req.user._id })
    if (updatingTheUser.statusofPayment) {
      updatingTheUser.statusofPayment = false
      await updatingTheUser.save()
    }

    return res.redirect("/user/dashboard/purchase_history")
  })
)

// cancel route of payment with stripe processing
router.get(
  "/canceltransaction",
  wrapAsync(async (req, res) => {
    if (req.session.discountinprice) {
      // i assumed that you will not give less than $1 discount in price always more than that.
      discount = req.session.discountinprice
      delete req.session.discountinprice
    }
    if (req.session.discountinpercentage) {
      discount = req.session.discountinpercentage / 100
      delete req.session.discountinpercentage
    }
    delete req.session.amount
    await req.session.save()
    const updatingTheUser = await User.findOne({ _id: req.user._id })
    updatingTheUser.statusofPayment = true
    await updatingTheUser.save()
    req.flash("error", "Payment canceled")
    return res.redirect("/cart/all")
  })
)
// paypal integration.
//paymentwithpaypa"l page.
router.get(
  "/paymentwithpaypal",
  wrapAsync(async (req, res) => {
    let cart = await Cart.find({ userId: req.user._id }).populate("product")
    let total = 0
    cart.forEach((c) => {
      c.categoryofprice.forEach((cat) => {
        total = total + cat.totalPrice
      })
    })
    if (req.session.discountinprice) {
      total = total - req.session.discountinprice
    }
    if (req.session.discountinpercentage) {
      total = total - total * (req.session.discountinpercentage / 100)
    }
    res.render("paypal_payment", { total: total.toFixed(2) })
  })
)
//paymentprocessingwithpaypal post route.
router.post(
  "/paymentwithpaypal",
  wrapAsync(async (req, res, next) => {
    const { address, phone, country, state, jobtitle, zipcode } = req.user
    if (address && phone && country && state && jobtitle && zipcode) {
      const priced = req.body.totalpayment
      req.session.amount = priced
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `${YOUR_DOMAIN}/payment/successtransaction`,
          cancel_url: `${YOUR_DOMAIN}/payment/canceltransaction`,
        },
        transactions: [
          {
            item_list: {
              items: [],
            },
            amount: {
              currency: "USD",
              total: priced,
            },
            description: "Thank you for purchasing",
          },
        ],
      }

      paypal.payment.create(
        create_payment_json,
        wrapAsync(async (error, payment) => {
          if (error) {
            throw error
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.redirect(payment.links[i].href)
              }
            }
          }
        })
      )
    } else {
      req.flash("error", "Please enter all your detail first")
      return res.redirect("/cart/checkout")
    }
  })
)
// success route of payment with paypal processing
router.get(
  "/successtransaction",
  wrapAsync(async (req, res, next) => {
    const payerId = req.query.PayerID
    const paymentId = req.query.paymentId

    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: req.session.amount,
          },
        },
      ],
    }
    // Obtains the transaction details from paypal
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      (error, payment) => {
        //When error occurs when due to non-existent transaction, throw an error else logging the transaction details in the console then send a Success string reposponse to the user.
        if (error) {
          throw error
        } else {
          req.session.method = "Paypal"
          isSuccess(req, res, next)
        }
      }
    )
    // payment status -> success
    const updatingTheUser = await User.findOne({ _id: req.user._id })
    if (updatingTheUser.statusofPayment) {
      updatingTheUser.statusofPayment = false
      await updatingTheUser.save()
    }
    return res.redirect("/user/dashboard/purchase_history")
  })
)

module.exports = router

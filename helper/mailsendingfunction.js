const nodemailer = require("nodemailer")
const DOMAIN = process.env.YOUR_DOMAIN || "http://localhost:3000"

module.exports.mailForVerify = async (email, token) => {
  const smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_AUTH_USER,
      pass: process.env.SMTP_AUTH_PASSWORD,
    },
  })
  const hello = await smtp.sendMail({
    to: email,
    from: process.env.SMTP_FROM_EMAIL,
    subject: "Mail Verification",
    html: `Click here to verify:  
            <br> 
            <a href="${DOMAIN}/user/login/${token}">
            ${DOMAIN}/user/login/${token}
            </a>`,
  })
  return hello
}

module.exports.mailForForgetpassword = async (email, token) => {
  const smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_AUTH_USER,
      pass: process.env.SMTP_AUTH_PASSWORD,
    },
  })
  const hello = await smtp.sendMail({
    to: email,
    from: process.env.SMTP_FROM_EMAIL,
    subject: "Mail Verification",
    html: `Click here to verify it's you:  
              <br> 
              <a href="${DOMAIN}/user/detailforchange/${token}">
                ${DOMAIN}/user/detailforchange/${token}
              </a>`,
  })
  return hello
}

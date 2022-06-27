module.exports.generateString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$*"
  let result = " "
  for (let i = 0; i < length; i++) {
    result +=
      i % 10 == 4
        ? " "
        : characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

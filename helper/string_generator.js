module.exports.generateString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$*"
  let result = " "
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result +=
      i / 10 == 6
        ? " "
        : characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

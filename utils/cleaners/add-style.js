/* eslint-env browser */

module.exports = (selector, style, value) => new Promise(resolve => {
  const element = document.querySelector(selector)
  if (!element) resolve(false)
  element.style[style] = value
  resolve(true)
})

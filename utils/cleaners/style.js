/* eslint-env browser */

module.exports = (style, value) => new Promise(resolve => {
  function getStyle(el, prop) {
    var view = document.defaultView
    if (view && view.getComputedStyle) {
      return view.getComputedStyle(el, null)[prop]
    }
    return el.currentStyle[prop]
  }
  function getElementByStyle(style, value, tag) {
    var all = document.getElementsByTagName(tag || '*')
    var len = all.length
    var result = []
    for ( var i = 0; i < len; i++ ) {
      if ( getStyle(all[i], style) === value )
        result.push(all[i])
    }
    return result
  }

  var elements = getElementByStyle(style, value)
  if (elements.length === 0) return resolve(false)
  elements[0].remove()
  resolve(true)
})

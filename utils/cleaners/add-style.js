/* eslint-env browser */

module.exports = (selectors, style, value) =>
  new Promise((resolve) => {
    const elements = document.querySelectorAll(selectors);
    if (!elements || !elements.length) resolve(false);
    [...elements].forEach((element) => (element.style[style] = value));
    resolve(true);
  });

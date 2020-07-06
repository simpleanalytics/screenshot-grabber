/* eslint-env browser */

module.exports = () =>
  new Promise((resolve) => {
    if (
      !document.querySelector(".qc-cmp-button") ||
      typeof window.__cmpui !== "function"
    )
      return resolve(false);
    window.__cmpui("setAndSaveAllConsent", true);
    resolve(true);
  });

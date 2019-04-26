module.exports = [{
  hostname: /\.?indiehackers.com$/i,
  waitForSelector: '.ember-view',
  waitFor: 5000
}, {
  hostname: /\.?remoteok.io$/i,
  addStylesToElements: [
    { elements: 'body > div.top', style: 'max-height', value: '600px' },
  ]
}, {
  hostname: /\.?yahoo.com$/i,
  clickElement: '.consent-form [name="agree"]'
}, {
  hostname: /\.?bing.com$/i,
  removeElementWithStyles: [
    { style: 'background-color', value: 'rgb(210, 225, 246)' },
  ]
}, {
  hostname: /\.?(duckduckgo\.com|ecosia\.org)$/i,
  path: /^\/$/i,
  fullPage: false
}, {
  hostname: /\.?instagram.com$/i,
  removeElementWithSelectors: ['[id="react-root"] section > div'],
  removeElementWithStyles: [
    { style: 'background-color', value: 'rgba(0, 0, 0, 0.8)' },
    { style: 'background-color', value: 'rgb(51, 51, 51)' },
  ]
}]

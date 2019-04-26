module.exports = [{
  hostname: /\.?indiehackers.com$/i,
  waitForSelector: '.ember-view',
  waitFor: 5000
}, {
  hostname: /\.?instagram.com$/i,
  removeElements: ['[id="react-root"] section > div'],
  removeStyles: [
    { style: 'background-color', value: 'rgba(0, 0, 0, 0.8)' },
    { style: 'background-color', value: 'rgb(51, 51, 51)' },
  ]
}]

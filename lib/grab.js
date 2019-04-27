// const puppeteer = require('puppeteer')
const fs = require('fs')
const sharp = require('sharp')
const { Readable, PassThrough } = require('stream')

const customCleaner = require('../utils/cleaners/custom')
const styleCleaner = require('../utils/cleaners/style')
const addStyleCleaner = require('../utils/cleaners/add-style')
const adapters = require('./adapters')

const SCREENSHOT_MAX_HEIGHT = 5000

const defaults = {
  waitUntil: 'networkidle2',
  userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64, SimpleAnalyticsBot/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36`,
  // userAgent: `SimpleAnalyticsBot/1.0 (+https://simpleanalytics.com)`,
  waitForFunction: null,
  waitForSelector: null,
  clickElement: null,
  fullPage: true,
  addStylesToElements: [],
  removeElementWithSelectors: [],
  removeElementWithStyles: [],
  width: 1280,
  height: 850,
  waitFor: 1000
}

const getAdapter = (url, path) => {
  const { hostname } = new URL(url)
  for (const adapter of adapters) {
    if (adapter.hostname && adapter.hostname.test(hostname) && (!adapter.path || adapter.path && adapter.path.test(path))) {
      return {
        ...defaults,
        ...adapter,
      }
    }
  }
  return defaults
}

module.exports.grabOneUrl = async (page, url, path) => {
  try {
    const bigPath = `./grabs/1280/${path}`
    const smallPath = `./grabs/632/${path}`

    if (!fs.existsSync(bigPath)) fs.mkdirSync(bigPath, { recursive: true })
    if (!fs.existsSync(smallPath)) fs.mkdirSync(smallPath, { recursive: true })

    const adapter = getAdapter(url, '/' + path.split('/').slice(1).join('/'))

    await page.setUserAgent(adapter.userAgent)
    await page.setViewport({ width: adapter.width, height: adapter.height })
    await page.goto(url, { waitUntil: adapter.waitUntil })
    await page._client.send('Animation.setPlaybackRate', { playbackRate: 20 })

    if (adapter.clickElement) await Promise.all([
      page.waitForNavigation({ waitUntil: adapter.waitUntil, timeout: 10000 }),
      page.click(adapter.clickElement),
    ])

    // Make sure the page with unlimited scrolling will not crash our system
    page.addStyleTag({content: `*{max-height: ${SCREENSHOT_MAX_HEIGHT}px;}`})

    // Hide data-screenshot="hidden" elements
    page.addStyleTag({content: `[data-screenshot="hidden"]{display: none !important;}`})

    if (adapter.waitForSelector) await page.waitForSelector(adapter.waitForSelector, { timeout: 10000 })
    else if (adapter.waitForFunction) await page.waitForFunction(adapter.waitForFunction, { timeout: 10000 })

    if (adapter.waitFor) await page.waitFor(adapter.waitFor)

    // Remove elements based on selectors
    if (adapter.removeElementWithSelectors) {
      for (const removeElement of adapter.removeElementWithSelectors) { try { await page.evaluate(customCleaner, removeElement) } catch (error) { console.error(error) }}
    }

    // Run a few cleaners which will run on every page
    const cleaners = [
      require('../utils/cleaners/banner'),
      require('../utils/cleaners/quantcast'),
    ]
    for (const cleaner of cleaners) { try { await page.evaluate(cleaner) } catch (error) { console.error(error) } }

    // Remove elements based on computed styles, useful when classes change all the time
    if (adapter.removeElementWithStyles) for (const { selector, style, value } of adapter.removeElementWithStyles) {
      try { await page.evaluate(styleCleaner, selector, style, value) } catch (error) { console.error(error) }
    }

    // Add styles to certain element, especially useful for element with height: 100vh
    if (adapter.addStylesToElements) for (const { elements, style, value } of adapter.addStylesToElements) {
      try { await page.evaluate(addStyleCleaner, elements, style, value) } catch (error) { console.error(error) }
    }

    const { contentSize: { height } } = await page._client.send('Page.getLayoutMetrics')
    const screenshotHeight = (height < SCREENSHOT_MAX_HEIGHT) ? height : SCREENSHOT_MAX_HEIGHT

    const buffer = await page.screenshot({ encoding: 'binary', path: `${bigPath}image.jpg`, fullPage: adapter.fullPage, type: 'jpeg', quality: 80 })

    const roundedCornerResizer = adapter.fullPage
      ? sharp().extract({ left: 0, top: 0, width: 1280, height: screenshotHeight }).resize(632).jpeg({ quality: 80 }).on('error', console.error)
      : sharp().resize(632).jpeg({ quality: 80 }).on('error', console.error)

    var readableStream = new Readable
    const stream0 = readableStream.pipe(roundedCornerResizer)
    var stream1 = stream0.pipe(new PassThrough())
    var stream2 = stream0.pipe(new PassThrough())
    readableStream.push(buffer)
    readableStream.push(null)

    stream2.pipe(fs.createWriteStream(`${smallPath}image.jpg`))
    return Promise.resolve(stream1)
  } catch (error) {
    console.error(error.message)
    return Promise.reject(error.message)
  }
}

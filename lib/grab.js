// const puppeteer = require('puppeteer')
const fs = require('fs')
const sharp = require('sharp')
const { Readable, PassThrough } = require('stream')

const quantcastCleaner = require('../utils/cleaners/quantcast')
const bannerCleaner = require('../utils/cleaners/banner')
const customCleaner = require('../utils/cleaners/custom')
const styleCleaner = require('../utils/cleaners/style')
const adapters = require('./adapters')

const SCREENSHOT_MAX_HEIGHT = 5000

const defaults = {
  waitUntil: 'networkidle2',
  waitForFunction: null,
  waitForSelector: null,
  removeElements: [],
  removeStyles: [],
  width: 1280,
  height: 720,
  waitFor: 500
}

const getAdapter = url => {
  const { hostname } = new URL(url)
  for (const adapter of adapters) if (adapter.hostname.test(hostname)) return { ...defaults, ...adapter }
  return defaults
}

module.exports.grabOneUrl = async (page, url, path) => {
  try {
    const bigPath = `./grabs/1280/${path}`
    const smallPath = `./grabs/632/${path}`

    if (!fs.existsSync(bigPath)) fs.mkdirSync(bigPath, { recursive: true })
    if (!fs.existsSync(smallPath)) fs.mkdirSync(smallPath, { recursive: true })

    const adapter = getAdapter(url)
    await page.setViewport({ width: adapter.width, height: adapter.height })
    await page.goto(url, { waitUntil: adapter.waitUntil })
    await page._client.send('Animation.setPlaybackRate', { playbackRate: 20 })

    if (adapter.waitForSelector) await page.waitForSelector(adapter.waitForSelector, { timeout: 10000 })
    else if (adapter.waitForFunction) await page.waitForFunction(adapter.waitForFunction, { timeout: 10000 })

    if (adapter.waitFor) await page.waitFor(adapter.waitFor)

    // Clean the pages
    const cleaners = [bannerCleaner, quantcastCleaner]
    if (adapter.removeElements) {
      for (const removeElement of adapter.removeElements) {
        try {
          await page.evaluate(customCleaner, removeElement)
        } catch (error) {
          console.error(error)
        }
      }
    } else {
      for (const cleaner of cleaners) {
        try {
          await page.evaluate(cleaner)
        } catch (error) {
          console.error(error)
        }
      }
    }
    if (adapter.removeStyles) {
      for (const { style, value } of adapter.removeStyles) {
        try {
          await page.evaluate(styleCleaner, style, value)
        } catch (error) {
          console.error(error)
        }
      }
    }

    const { contentSize: { height } } = await page._client.send('Page.getLayoutMetrics')
    const screenshotHeight = (height < SCREENSHOT_MAX_HEIGHT) ? height : SCREENSHOT_MAX_HEIGHT

    const buffer = await page.screenshot({ encoding: 'binary', path: `${bigPath}image.jpg`, clip: { x: 0, y: 0, width: 1280, height: screenshotHeight }, type: 'jpeg', quality: 80 })

    const roundedCornerResizer = sharp().resize(632).jpeg({ quality: 80 })
    var readableStream = new Readable
    readableStream.pipe(roundedCornerResizer)

    var writeFileStream = readableStream.pipe(new PassThrough())
    writeFileStream.pipe(fs.createWriteStream(`${smallPath}image.jpg`))

    var writeBodyStream = readableStream.pipe(new PassThrough())

    readableStream.push(buffer)
    readableStream.push(null)

    return Promise.resolve(writeBodyStream)
  } catch (error) {
    console.error(error.message)
    return Promise.reject(error.message)
  }
}

const request = require('request')
const sharp = require('sharp')
const fs = require('fs')
const CPU_COUNT = require('os').cpus().length || 1
const http = require('http')
const { PassThrough } = require('stream')

const { grabOneUrl } = require('./lib/grab')
const { MimeChecker } = require('./lib/transformers')

const { PORT, APP_URL } = process.env
const port = PORT || 3002

const { Cluster } = require('puppeteer-cluster')
const { purge } = require('./lib/cloudflare')

;(async () => {
  console.log(`==> Launching puppeteer cluster with ${CPU_COUNT} workers`)
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: CPU_COUNT,
  })

  await cluster.task(async ({ page, data: { url, path } }) => {
    try {
      return await grabOneUrl(page, url, path)
    } catch (error) {
      console.error(error.message)
    }
  })

  const handleError = (res, error) => {
    console.log('==>', error.message)
    if (res.headersSent) return console.error('Headers already send')
    res.setHeader('Content-Type', 'text/plain')
    res.statusCode = 400
    return res.end(error.message)
  }

  const cleanUrl = url => {
    url = url.slice(1).toLowerCase()
    url = decodeURIComponent(url)
    url = url.replace(/[^-a-z0-9/_.:@]/g, '')
    if (!url.startsWith('http')) url = 'http://' + url
    if (url.indexOf('.') === -1) throw new Error(`Invalid URL: ${url}`)
    return url
  }

  const server = http.createServer(async (req, res) => {
    try {
      res.setHeader('Content-Type', 'image/jpeg')

      let { pathname: url } = require('url').parse(req.url)

      // Hide favicon request from logs
      if (url === '/favicon.ico') return res.end()

      // Block recursive loading our own server
      if (/screenshots\.simpleanalytics(cdn)?\.(com|io|is)/gi.test(url)) throw new Error(`Invalid URL because it's recursive`)

      let path

      const isProxy = url.startsWith('/proxy/')

      if (isProxy) {
        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('Cache-Control', 'public, max-age=86400') // one day
        const unsafeURL = url.slice('/proxy/'.length)
        const cleanURL = cleanUrl(url.slice('/proxy/'.length - 1))
        const storeURL = cleanURL.replace(/^https?:\/\//gi, '').replace(/[^a-zA-Z0-9._%-/]+/gi, '-').replace(/(^[. ]+|[. ]+$)/gi, '')
        const folder = './proxy/' + storeURL.split('/').slice(0, -1).join('/')
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

        let width
        const { width: widthString } = require('url').parse(req.url, true).query
        if (/[0-9]+/.test(widthString)) width = parseInt(width, 10)
        if (width && width > 1440) width = 1440

        const mimeChecker = new MimeChecker()

        let response

        if (width) response = request(decodeURIComponent(unsafeURL)).on('error', error => handleError(res, error)).pipe(mimeChecker).pipe(sharp().resize(parseInt(width, 10), parseInt(width, 10), { fit: 'contain' }).jpeg({ quality: 80 }))
        else response = request(decodeURIComponent(unsafeURL)).on('error', error => handleError(res, error)).pipe(mimeChecker).pipe(sharp().jpeg({ quality: 80 }))

        const resStream = new PassThrough()
        const saveStream = new PassThrough()

        response.pipe(resStream)
        response.pipe(saveStream)

        response.on('error', error => handleError(res, error))

        resStream.pipe(res)
        saveStream.pipe(fs.createWriteStream(`./proxy/${storeURL}`)).on('error', console.error)
      } else {
        const isRefresh = url.startsWith('/refresh/')
        url = isRefresh ? url.slice('/refresh/'.length - 1) : url
        url = cleanUrl(url)

        const { hostname, pathname } = new URL(url)
        path = `${hostname}${pathname}` + (pathname.slice(-1) === '/' ? '' : '/')

        try {
          if (isRefresh) purge([ `${APP_URL}/${path}`, `${APP_URL}/${path}`.slice(0, -1) ]) // no async
        } catch (error) {
          // nothing
        }

        console.log('==>', url)

        const stream = await cluster.execute({ url, path })
        if (!stream) {
          res.setHeader('Content-Type', 'text/plain')
          res.statusCode = 404
          return res.end(`Couldn't get screenshot from this URL`)
        }

        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('Cache-Control', 'public, max-age=86400') // one day
        stream.pipe(res)
      }
    } catch (error) {
      handleError(res, error)
    }
  })

  server.on('error', err => {
    console.error(`SERVER ERROR: ${err.message}`)
    process.exit(1)
  })

  server.listen(port, async () => {
    console.log(`App with pid ${process.pid} started listening on http://localhost:${port}`)
  })
})()

process.on('uncaughtException', err => {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})

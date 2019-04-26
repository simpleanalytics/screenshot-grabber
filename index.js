const { grabOneUrl } = require('./lib/grab')

const { PORT, APP_URL } = process.env
const port = PORT || 3002

let numCPUs = require('os').cpus().length || 1
const http = require('http')

const { Cluster } = require('puppeteer-cluster')
const { purge } = require('./lib/cloudflare')

;(async () => {
  console.log(`==> Launching puppeteer cluster with ${numCPUs} workers`)
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: numCPUs,
  })

  await cluster.task(async ({ page, data: { url, path } }) => {
    try {
      return await grabOneUrl(page, url, path)
    } catch (error) {
      console.error(error.message)
    }
  })

  const server = http.createServer(async (req, res) => {
    try {
      res.setHeader('Content-Type', 'image/jpeg')

      let { pathname: url } = require('url').parse(req.url)
      let path

      const isRefresh = url.slice(0, 9) === '/refresh/'

      url = isRefresh ? url.slice(8) : url
      url = url.slice(1).toLowerCase()
      url = decodeURIComponent(url)
      url = url.replace(/[^-a-z0-9/_.@]/g, '')
      if (!url.startsWith('http')) url = 'http://' + url
      if (url.indexOf('.') === -1) throw new Error(`Invalid URL: ${url}`)

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
    } catch (error) {
      res.setHeader('Content-Type', 'text/plain')
      console.log(error.message)
      res.statusCode = 404
      return res.end(error.message)
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

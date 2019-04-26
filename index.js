const { grabOneUrl } = require('./lib/grab')

const port = process.env.PORT || 3002

let numCPUs = require('os').cpus().length || 1
const http = require('http')

// const urls = [
//   'news.ycombinator.com',
//   'github.com/agarrharr/awesome-static-website-services/blob/master/readme.md',
//   'https://simpleanalytics.io',
//   'https://wip.chat/',
//   'https://simpleanalytics.io/nomadlist.com',
//   'https://wip.chat/products/1667/pending',
//   'https://instagram.com/goudenlijntjes/',
//   'https://instagram.com/p/BvzTiw6lZvd/',
//   'http://remoteok.io/remote-jobs/71087-remote-customer-support-manager-100k-year-remote-work-crossover',
//   'http://remoteok.io/remote-companies',
//   'https://facebook.com',
//   'https://instagram.com',
//   'http://indiehackers.com/interview/how-i-started-a-business-with-two-lines-of-code-37f3d5348e',
// ]

const { Cluster } = require('puppeteer-cluster')

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
      url = url.slice(1).toLowerCase()
      url = decodeURIComponent(url)
      url = url.replace(/[^-a-z0-9/_.]/g, '')
      if (!url.startsWith('http')) url = 'http://' + url
      if (url.indexOf('.') === -1) throw new Error(`Invalid URL: ${url}`)

      const { hostname, pathname } = new URL(url)
      path = `${hostname}${pathname}` + (pathname.slice(-1) === '/' ? '' : '/')

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

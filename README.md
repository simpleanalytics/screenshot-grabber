## Simple Analytics Screenshot Grabber

You are welcome to help improving the screenshots we make. There are two files that are important:

1. [lib/adapters.js](https://github.com/simpleanalytics/screenshot-grabber/blob/master/lib/adapters.js) where you can specify certain filters (to remove elements based on querySelector or computer style)
1. [utils/cleaners](https://github.com/simpleanalytics/screenshot-grabber/tree/master/utils/cleaners) where you can specify specific cleaners (to close cookie banners for example)

Just create a PR and we are happy to merge.

### Links

- Inspired by [premieroctet/screen-guru](https://github.com/premieroctet/screen-guru)
- Using [thomasdondorf/puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster)
- Using [GoogleChrome/puppeteer](https://github.com/GoogleChrome/puppeteer)

const util = require('util')
const request = util.promisify(require('request'))

const { CLOUDFLARE_ZONE, CLOUDFLARE_AUTH_EMAIL, CLOUDFLARE_AUTH_KEY } = process.env

module.exports.purge = async (urls) => {
  const options = {
    json: true,
    method: 'post',
    url: `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache`,
    headers: {
      'X-Auth-Email': CLOUDFLARE_AUTH_EMAIL,
      'X-Auth-Key': CLOUDFLARE_AUTH_KEY,
      'Content-Type': 'application/json'
    },
    body: { files: urls }
  }

  const { body } = await request(options)
  if (!body && !body.success) console.error('[CLOUDFLARE][ERROR]', JSON.stringify(body))
}

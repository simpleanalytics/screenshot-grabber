const { Transform } = require('stream')
const { Magic, MAGIC_MIME_TYPE } = require('mmmagic')

class MimeChecker extends Transform {
  constructor(options) {
    super(options)
    this.checked = false
  }

  _transform(chunk, encoding, callback) {
    if (this.checked) {
      this.push(chunk)
      return callback()
    }

    new Magic(MAGIC_MIME_TYPE).detect(chunk, (err, result) => {
      this.checked = true

      if (!result.startsWith('image/')) return callback(new Error('Wrong MIME type, only images allowed'))

      this.push(chunk)
      return callback()
    })
  }
}

module.exports = { MimeChecker }

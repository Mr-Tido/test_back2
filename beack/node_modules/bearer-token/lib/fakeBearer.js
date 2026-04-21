var crypto = require('crypto')

function fakeBearer () {
  return crypto.randomBytes(64).toString('base64')
}

module.exports = fakeBearer

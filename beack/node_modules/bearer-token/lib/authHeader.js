var parseAuthHeader = require('auth-header').parse

function getAuthHeaderToken (req) {
  var headers = req.headers

  if (headers.authorization) {
    var authHeaders = parseAuthHeader(headers.authorization)
    var token = authHeaders.token
    return token
  }
}

module.exports = getAuthHeaderToken

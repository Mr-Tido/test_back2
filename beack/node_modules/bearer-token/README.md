# bearer-token

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]

[npm-image]: https://img.shields.io/npm/v/bearer-token.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/bearer-token
[travis-image]: https://img.shields.io/travis/bcomnes/node-bearer-token.svg?style=flat-square
[travis-url]: https://travis-ci.org/bcomnes/node-bearer-token

Callback with a [rfc6750](https://tools.ietf.org/html/rfc6750) OAuth 2.0 Bearer Token from an http request object, ready for verification.

## Install

```
npm install bearer-token
```

## Example

```js
var bearerToken = require('bearer-token')
var http = require('http')

server = http.createServer()
server.listen(8000, function () {
  console.log('server started on 8000')
})

server.on('request', function(req ,res) {
  bearerToken(req, function(err, token) {
    // Now you have to verify the token
  })
})
```

Pass in a standard `http` `reuest` object to extract a single bearer token from the request in the callback, if it exists.  If no bearer token is found, `token` will be undefined.  The first bearer token that is found is returned.  Authentication headers take precidence over tokens found in the body.

## Arguments

### `var bearerToken = require('bearer-token')`

`bearerToken` is a single asyncronous function.

### `bearerToken(req, callback)`

- `req` Accepts a standard [`http` request object](https://nodejs.org/api/http.html#http_http_incomingmessage).  The request header and body are parsed in search of a bearer token.  Tokens found in the request header take precidence over tokens in the body.
- `callback(error, token)` Function is called with any errors and a token if found.  A missing token is not grounds for an error (only parsing or unexpected errors).
  - `error` Error object if anything bad happened.
  - `token` String if a token is found.  You still need to verify it.

## Contributing

Contributions welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## Contributors

<table><tbody><tr><th align="left">bcomnes</th><td><a href="https://github.com/bcomnes">GitHub/bcomnes</a></td></tr>
<tr><th align="left">wpacks</th><td><a href="https://github.com/wpacks">GitHub/wpacks</a></td></tr>
</tbody></table>

## License

[ISC](LICENSE.md)

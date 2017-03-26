'use strict'

const co = require('co')
const http = require('http')
const fetch = require('node-fetch')
const createRatelimiter = require('./createRatelimiter')
const createProxy = require('./createProxy')

module.exports = function (config, logger) {
  const ratelimiter = createRatelimiter(fetch, config, logger)
  const proxy = createProxy(ratelimiter, config, logger)

  const server = http.createServer(co.wrap(function * (request, response) {
    if (request.method !== 'POST') {
      response.writeHead(405)
      response.end('Only POST requests are allowed')
      return
    }
    const allowed = yield ratelimiter.check(response)
    if (allowed) {
      proxy.web(request, response)
    }
  }))

  server.on('error', error => {
    logger.log(`Server error: ${error.message}`)
  })

  return server
}

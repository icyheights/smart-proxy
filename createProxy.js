'use strict'

const httpProxy = require('http-proxy')

const DEFAULT_TIMEOUT = 1000

module.exports = function (ratelimiter, config, logger) {
  const { target } = config
  const targetUrl = `http://${target.ip}:${target.port}`
  const proxy = httpProxy.createProxyServer({
    target: targetUrl,
    proxyTimeout: target.timeout || DEFAULT_TIMEOUT
  })

  proxy.on('proxyRes', targetResponse => {
    const { status } = targetResponse
    if (status < 300 && status >= 200) {
      ratelimiter.count()
    }
  })

  proxy.on('error', (error, request, response) => {
    logger.log(`Error while forwarding: ${error.message}`)
    response.writeHead(config.PROXY_RESPONSE_STATUS_ON_TARGET_FAIL)
    response.end()
  })

  return proxy
}

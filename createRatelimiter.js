'use strict'

const co = require('co')

const DEFAULT_TIMEOUT = 1000
const REDIRECT_ACTION = 'error' // see node-fetch doc for other options

function sendStatus (response, status) {
  response.writeHead(status)
  response.end()
}

module.exports = function (fetch, config, logger) {
  const { ratelimiter, target } = config
  const checkUrl = `http://${ratelimiter.host}:${ratelimiter.port}/check?ip=${target.ip}`
  const countUrl = `http://${ratelimiter.host}:${ratelimiter.port}/count?ip=${target.ip}`
  const timeout = ratelimiter.timeout || DEFAULT_TIMEOUT

  const fetchRatelimiter = co.wrap(function * (url) {
    try {
      return yield fetch(url, {
        method: 'POST',
        redirect: REDIRECT_ACTION,
        timeout
      })
    } catch (error) {
      logger.log(`Failed to fetch ${url}: ${error.message}`)
      return null
    }
  })

  const check = co.wrap(function * (proxyResponse) {
    const ratelimiterResponse = yield fetchRatelimiter(checkUrl)
    if (ratelimiterResponse === null) {
      sendStatus(proxyResponse, config.PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL)
      return false
    }
    const { status } = ratelimiterResponse
    if (status === config.RATELIMITER_ALLOW_STATUS) return true
    if (status === config.RATELIMITER_DENY_STATUS) {
      sendStatus(proxyResponse, config.PROXY_RESPONSE_STATUS_ON_RATELIMITER_DENY)
      return false
    }
    logger.log(`Incorrect ratelimiter reply status: ${status}`)
    sendStatus(proxyResponse, config.PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL)
    return false
  })

  const count = co.wrap(function * () {
    const ratelimiterResponse = yield fetchRatelimiter(countUrl)
    if (ratelimiterResponse !== null) {
      const { status } = ratelimiterResponse
      if (status === config.RATELIMITER_COUNT_OK_STATUS) return
      logger.log(`Incorrect ratelimiter count status: ${status}`)
    }
  })

  return {
    check,
    count
  }
}

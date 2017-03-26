'use strict'

module.exports = {
  ratelimiter: {
    host: 'localhost',
    port: 31338
  },
  target: {
    ip: '127.0.0.1'
  },
  RATELIMITER_ALLOW_STATUS: 200,
  RATELIMITER_DENY_STATUS: 429,
  RATELIMITER_COUNT_OK_STATUS: 202,
  PROXY_RESPONSE_STATUS_ON_RATELIMITER_DENY: 429,
  PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL: 502
}

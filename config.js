'use strict'

module.exports = {
  proxy: {
    host: '0.0.0.0',
    port: 31337
  },
  ratelimiter: {
    host: 'localhost',
    port: 31338,
    timeout: 1000
  },
  target: {
    ip: '127.0.0.1',
    port: 31339,
    timeout: 1000
  },
  RATELIMITER_ALLOW_STATUS: 200,
  RATELIMITER_DENY_STATUS: 429,
  RATELIMITER_COUNT_OK_STATUS: 202,
  PROXY_RESPONSE_STATUS_ON_RATELIMITER_DENY: 429,
  PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL: 502,
  PROXY_RESPONSE_STATUS_ON_TARGET_FAIL: 502
}

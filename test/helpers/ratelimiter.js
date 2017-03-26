'use strict'

const express = require('express')
const testConfig = require('./config')
const createHandler = require('./createHandler')

const REQUESTS_ALLOWED = 9

// Ratelimiter mock server
const app = express()

/**
 * check handler will allow REQUESTS_ALLOWED requests
 * then replies with 429, 303, 500
 * then it will shut down on next request, without replying
 */
function reply200 (res) { res.status(testConfig.RATELIMITER_ALLOW_STATUS).send(testConfig.target.reply) }
app.locals.checkRequestCount = 0
app.locals.checkReplyOrder = [
  ...[...(new Array(REQUESTS_ALLOWED).keys())].map(() => reply200),
  res => res.status(testConfig.RATELIMITER_DENY_STATUS).end(),
  res => res.redirect(303, '/test'),
  res => res.status(500).end(),
  res => res.app.locals.server.close()
]
app.post('/check', createHandler('checkRequestCount', 'checkReplyOrder'))

/**
 * count handler replies with 202, 303, 400, 500 and stop replying after that
 */
app.locals.countRequestCount = 0
app.locals.countReplyOrder = [
  res => res.status(testConfig.RATELIMITER_COUNT_OK_STATUS).end(),
  res => res.redirect(303, '/test'),
  res => res.status(400).end(),
  res => res.status(500).end(),
]
app.post('/count', createHandler('countRequestCount', 'countReplyOrder'))

app.locals.server = app.listen(testConfig.ratelimiter.port)

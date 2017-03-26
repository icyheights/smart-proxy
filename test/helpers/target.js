'use strict'

const express = require('express')
const testConfig = require('./config')
const createHandler = require('./createHandler')

const REQUESTS_ALLOWED = 5

// Proxy target mock server
const app = express()

/**
 * handler will reply for REQUESTS_ALLOWED requests
 * then replies with 303, 400, 500
 * then it will shut down on next request, without replying
 */
function reply200 (res) { res.status(200).send(testConfig.target.reply) }
app.locals.requestCount = 0
app.locals.replyOrder = [
  ...[...(new Array(REQUESTS_ALLOWED).keys())].map(() => reply200),
  res => res.redirect(303, '/test'),
  res => res.status(400).end(),
  res => res.status(500).end(),
  res => res.app.locals.server.close()
]
app.post('*', createHandler('requestCount', 'replyOrder'))

app.locals.server = app.listen(testConfig.target.port)

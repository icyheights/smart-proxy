'use strict'

const sinon = require('sinon')
const path = require('path')
const supertest = require('supertest')
const co = require('co')
const test = require('ava')
const fork = require('child_process').fork
const createServer = require('../createServer')
const testConfig = require('./helpers/config')

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * A 13 step scenario
 * Ratelimiter allows first 9 requests, then denies one, then replies with other codes, and goes offline on 13th request
 * Target replies with 200 first 5 requests, then starts to reply other codes, and goes offline on 9th request
 * Ratelimiter count replies with 200, then other codes, then stops responding on 5th request
 * The proxy is expected to handle all these cases without fail
 */
test.beforeEach(t => {
  t.context.ratelimiterMock = fork(path.resolve(__dirname, './helpers/ratelimiter.js'))
  t.context.targetMock = fork(path.resolve(__dirname, './helpers/target.js'))

  t.context.targetMockFinished = false
  t.context.ratelimiterMockFinished = false

  t.context.ratelimiterMock.on('exit', () => { t.context.ratelimiterMockFinished = true })
  t.context.targetMock.on('exit', () => { t.context.targetMockFinished = true })

  // FIXME wait for mock servers to init. Not good, better make some solid confirmation
  return timeout(1000)
})
test.afterEach.always(t => {
  if (!t.context.targetMockFinished) t.context.targetMock.kill()
  if (!t.context.ratelimiterMockFinished) t.context.ratelimiterMock.kill()
})
test('server should pass complex testing scenario', co.wrap(function * (t) {
  const loggerMock = { log: sinon.spy() }
  const server = createServer(testConfig, loggerMock)

  // Request 1, everything ok
  const response1 = yield supertest(server).post('/test').expect(200)
  t.is(response1.text, testConfig.target.reply)

  // Request 2, count returns 303, proxy should log that
  const response2 = yield supertest(server).post('/test').expect(200)
  t.is(response2.text, testConfig.target.reply)
  yield timeout(100) // wait for count request to finish
  t.true(loggerMock.log.args[0][0].includes('count status: 303'))

  // Request 3, count returns 400, proxy should log that
  const response3 = yield supertest(server).post('/test').expect(200)
  t.is(response3.text, testConfig.target.reply)
  yield timeout(100) // wait for count request to finish
  t.true(loggerMock.log.args[1][0].includes('count status: 400'))

  // Request 4, count returns 500, proxy should log that
  const response4 = yield supertest(server).post('/test').expect(200)
  t.is(response4.text, testConfig.target.reply)
  yield timeout(100) // wait for count request to finish
  t.true(loggerMock.log.args[2][0].includes('count status: 500'))

  // Request 5, count does not reply, proxy should log that
  const response5 = yield supertest(server).post('/test').expect(200)
  t.is(response5.text, testConfig.target.reply)
  yield timeout(200) // wait for count request to timeout
  t.true(loggerMock.log.args[3][0].includes('Failed to fetch'))

  // Request 6, target replies with 303, proxy forwards that
  yield supertest(server).post('/test').expect(303)

  // Request 7, target replies with 400, proxy forwards that
  yield supertest(server).post('/test').expect(400)

  // Request 8, target replies with 500, proxy forwards that
  yield supertest(server).post('/test').expect(500)

  // Request 9, target offline, proxy replies with configured status and logs error
  yield supertest(server).post('/test').expect(testConfig.PROXY_RESPONSE_STATUS_ON_TARGET_FAIL)
  t.true(loggerMock.log.args[4][0].includes('Error while forwarding'))

  // Request 10, ratelimiter forbids access, proxy replies with configured status
  yield supertest(server).post('/test').expect(testConfig.PROXY_RESPONSE_STATUS_ON_RATELIMITER_DENY)

  // Request 11, ratelimiter replies with 303, proxy replies with configured status and logs
  yield supertest(server).post('/test').expect(testConfig.PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL)
  t.true(loggerMock.log.args[5][0].includes('ratelimiter reply status: 303'))

  // Request 12, ratelimiter replies with 500, proxy replies with configured status and logs
  yield supertest(server).post('/test').expect(testConfig.PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL)
  t.true(loggerMock.log.args[6][0].includes('ratelimiter reply status: 500'))

  // Request 13, ratelimiter offline, proxy replies with configured status and logs
  yield supertest(server).post('/test').expect(testConfig.PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL)
  t.true(loggerMock.log.args[7][0].includes('Failed to fetch'))
}))

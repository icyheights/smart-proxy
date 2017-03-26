'use strict'

const co = require('co')
const test = require('ava')
const sinon = require('sinon')
const createRatelimiter = require('./createRatelimiter')
const testConfig = require('./test/helpers/config')

const createResponseMock = () => ({
  writeHead: sinon.spy(),
  end: sinon.spy()
})

const createLoggerMock = () => ({
  log: sinon.spy()
})

function validateResponse (t, responseMock, status) {
  t.true(responseMock.writeHead.calledOnce)
  t.true(responseMock.writeHead.calledWith(status))
  t.true(responseMock.end.calledOnce)
}

function validateLogger (t, loggerMock, substring) {
  t.true(loggerMock.log.calledOnce)
  if (substring) {
    t.true(loggerMock.log.args[0][0].includes(substring))
  }
}

test('check performs POST request', co.wrap(function * (t) {
  const fetchMock = sinon.spy(() => Promise.resolve({ status: testConfig.RATELIMITER_ALLOW_STATUS }))

  const ratelimiter = createRatelimiter(fetchMock, testConfig, {})
  yield ratelimiter.check()
  t.is(fetchMock.args[0][1].method, 'POST')
}))

test('check returns true when ratelimiter allowed status returned by fetch', co.wrap(function * (t) {
  function fetchMock () { return Promise.resolve({ status: testConfig.RATELIMITER_ALLOW_STATUS }) }

  const ratelimiter = createRatelimiter(fetchMock, testConfig, {})
  const allowed = yield ratelimiter.check({})
  t.true(allowed)
}))

test('check responds with correct status when ratelimiter deny status is returned by fetch', co.wrap(function * (t) {
  function fetchMock () { return Promise.resolve({ status: testConfig.RATELIMITER_DENY_STATUS }) }
  const responseMock = createResponseMock()

  const ratelimiter = createRatelimiter(fetchMock, testConfig, {})
  const allowed = yield ratelimiter.check(responseMock)
  t.false(allowed)
  validateResponse(t, responseMock, testConfig.PROXY_RESPONSE_STATUS_ON_RATELIMITER_DENY)
}))

test('check logs and responds with correct status when any other status is returned by fetch', co.wrap(function * (t) {
  function fetchMock () { return Promise.resolve({ status: 300 }) }
  const responseMock = createResponseMock()
  const loggerMock = createLoggerMock()

  const ratelimiter = createRatelimiter(fetchMock, testConfig, loggerMock)
  const allowed = yield ratelimiter.check(responseMock)
  t.false(allowed)
  validateLogger(t, loggerMock, 'reply status')
  validateResponse(t, responseMock, testConfig.PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL)
}))

test('check logs and responds with correct status when fetch fails', co.wrap(function * (t) {
  const errorMock = { message: 'Test error' }
  function fetchMock () { return Promise.reject(errorMock) }
  const responseMock = createResponseMock()
  const loggerMock = createLoggerMock()

  const ratelimiter = createRatelimiter(fetchMock, testConfig, loggerMock)
  const allowed = yield ratelimiter.check(responseMock)
  t.false(allowed)
  validateLogger(t, loggerMock, errorMock.message)
  validateResponse(t, responseMock, testConfig.PROXY_RESPONSE_STATUS_ON_RATELIMITER_FAIL)
}))

test('count performs POST request', co.wrap(function * (t) {
  const fetchMock = sinon.spy(() => Promise.resolve({ status: testConfig.RATELIMITER_COUNT_OK_STATUS }))

  const ratelimiter = createRatelimiter(fetchMock, testConfig, {})
  yield ratelimiter.count()
  t.is(fetchMock.args[0][1].method, 'POST')
}))

test('count logs when any status other than 202 is returned by fetch', co.wrap(function * (t) {
  function fetchMock () { return Promise.resolve({ status: 400 }) }
  const loggerMock = createLoggerMock()

  const ratelimiter = createRatelimiter(fetchMock, testConfig, loggerMock)
  yield ratelimiter.count()
  validateLogger(t, loggerMock, 'count status')
}))

test('count logs when fetch fails', co.wrap(function * (t) {
  const errorMock = { message: 'Test error' }
  function fetchMock () { return Promise.reject(errorMock) }
  const loggerMock = createLoggerMock()

  const ratelimiter = createRatelimiter(fetchMock, testConfig, loggerMock)
  yield ratelimiter.count()
  validateLogger(t, loggerMock, errorMock.message)
}))

'use strict'

const test = require('ava')
const sinon = require('sinon')
const createProxy = require('./createProxy')
const testConfig = require('./test/helpers/config')

test('proxy counts 2xx replies', t => {
  const ratelimiterMock = { count: sinon.spy() }
  const loggerMock = { log () {} }
  const response200Mock = { statusCode: 200 }
  const response299Mock = { statusCode: 299 }

  const proxy = createProxy(ratelimiterMock, testConfig, loggerMock)
  proxy.emit('proxyRes', response200Mock)
  proxy.emit('proxyRes', response299Mock)

  t.true(ratelimiterMock.count.calledTwice)
})

test('proxy logs errors, and replies with configured status', t => {
  const loggerMock = { log: sinon.spy() }
  const responseMock = {
    writeHead: sinon.spy(),
    end: sinon.spy()
  }
  const errorMock = { message: 'test error' }

  const proxy = createProxy({}, testConfig, loggerMock)
  proxy.emit('error', errorMock, {}, responseMock)
  t.true(loggerMock.log.calledOnce)
  t.true(loggerMock.log.args[0][0].includes(errorMock.message))
  t.true(responseMock.writeHead.calledOnce)
  t.true(responseMock.writeHead.calledWith(testConfig.PROXY_RESPONSE_STATUS_ON_TARGET_FAIL))
  t.true(responseMock.end.calledOnce)
})

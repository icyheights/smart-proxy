'use strict'

const test = require('ava')
const supertest = require('supertest')
const createServer = require('./createServer')
const testConfig = require('./test/helpers/config')

test('server should reply with 405 on non-POST requests', t => {
  const server = createServer(testConfig)

  return Promise.all([
    supertest(server).get('/').expect(405),
    supertest(server).head('/').expect(405),
    supertest(server).put('/').expect(405),
    supertest(server).patch('/').expect(405),
    supertest(server).delete('/').expect(405)
  ])
})

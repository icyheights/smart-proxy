'use strict'

const config = require('./config')
const createServer = require('./createServer')

// TODO change for something like winston
const logger = console
const server = createServer(config, logger)

const { proxy: { host, port } } = config
server.listen(port, host)

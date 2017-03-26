# smart-proxy
A proxy that checks target load on a dedicated service

# System requirements
Developed and tested on Debian 8 and node 6.10

# Usage
* clone repository and cd inside
* run `npm install` to get necessary dependencies
* call `npm test` to run test suite
* edit `config.js` as necessary, setting host and port parameters for ratelimiter and target
* call `npm start` to run proxy with settings taken from `config.js`

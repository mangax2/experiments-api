require('babel-register')
const express = require('express')
const createProfileMiddleware = require('@monsantoit/profile-middleware')
const path = require('path')
const bodyParser = require('body-parser')
const log4js = require('log4js')

const logger = log4js.getLogger('app')
const localDevelopment = process.env.NODE_ENV !== 'production'
const appBaseUrl = '/experiments-api'

const app = express()

// const x = (function() {
//   var createPingPage, i, len, pingPage, ref, results
//   createPingPage = require('@monsantoit/ping-page')
//   pingPage = createPingPage(require('./package.json'))
//   ref = ['/ping', appBaseUrl + "/ping"]
//   results = []
//   for (i = 0, len = ref.length; i < len; i++) {
//     const path = ref[i]
//     results.push(app.get(path, pingPage))
//   }
//   return results
// })()

const compression = require('compression')
app.use(compression())
app.use(bodyParser.json())

localDevProfile = {
  id: 'testuser'
}

app.use(createProfileMiddleware({
  localDevProfile: localDevProfile
}))

app.use('/experiments-api', require('./routes/routes'))

app.use(function(error, req, res, next) {
  if (error != null) {
    console.error(error)
    res.status(error.status || 500)
    if (typeof error.body === 'object') {
      logger.error('error.body')
      return res.json(error.body)
    } else {
      logger.error(error.message || error.toString())
      return res.send(error.message || error.toString())
    }
  } else {
    return next()
  }
})

process.on('uncaughtException', function(error) {
  logger.fatal(error)
  logger.fatal('Fatal error encountered, exiting now')
  return process.exit(1)
})

const port = process.env.PORT || 3001

server = app.listen(port, function() {
  var address, url
  address = server.address()
  url = "http://" + (address.host || 'localhost') + ":" + port
  return logger.info("Listening at " + url)
})

module.exports = app
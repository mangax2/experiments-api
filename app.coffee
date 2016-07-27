express = require 'express'
createProfileMiddleware = require '@monsantoit/profile-middleware'
path = require 'path'
bodyParser = require 'body-parser'
log4js = require 'log4js'
logger = log4js.getLogger 'app'

localDevelopment = process.env.NODE_ENV != 'production'

app = express()
compression = require 'compression'
app.use compression()
app.use bodyParser.json()
app.use bodyParser.urlencoded extended: false

localDevProfile =
  id: 'testuser'

# hook in @monsantoit middleware so that Ocelot user-profile header is available
# in the express request object ( e.g. req.userProfile.id )
app.use createProfileMiddleware(localDevProfile: localDevProfile)

app.use '/experiments-api', require './routes/routes'

# Request handler invoke by all the requests
app.use (error, req, res, next) ->
  if error?
    console.error error
    res.status error.status or 500
    if  typeof error.body == 'object'
      logger.error 'error.body'
      res.json error.body
    else
      logger.error error.message or error.toString()
      res.send error.message or error.toString()
  else
    next() # the request is passed to next handler

process.on 'uncaughtException', (error) ->
  logger.fatal error
  logger.fatal 'Fatal error encountered, exiting now'
  process.exit 1

port = process.env.PORT or 3000
server = app.listen port, ->
  address = server.address()
  url = "http://#{address.host or 'localhost'}:#{port}"
  logger.info "Listening at #{url}"


module.exports = app


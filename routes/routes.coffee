express = require 'express'

log4js = require 'log4js'
logger = log4js.getLogger 'Router'
filesystem = require 'fs'
router = express.Router()

router.get '/ping', (req, res) ->
  logger.debug "the user for /ping url is '#{req.userProfile.id}'"
  res.json message: 'Received Ping request: Experiments API !!!'

module.exports = router


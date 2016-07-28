express = require 'express'

log4js = require 'log4js'
logger = log4js.getLogger 'Router'
filesystem = require 'fs'
ExperimentsService = require '../services/ExperimentsService'


router = express.Router()

router.get '/ping', (req, res) ->
  logger.debug "the user for /ping url is '#{req.userProfile.id}'"
  res.json message: 'Received Ping request: Experiments API !!!'

router.get '/experiments', (req, res) ->
  new ExperimentsService().getAllExperiments()
  .then (r) ->
    res.json r
  .catch (err) ->
    handleCatch res, err

router.get '/experiments/:id', (req, res) ->
  id = req.params.id
  new ExperimentsService().getExperimentById id
  .then (experiment) ->
    res.json experiment
  .catch (err) ->
    handleCatch res, err


module.exports = router


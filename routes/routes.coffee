express = require 'express'

log4js = require 'log4js'
logger = log4js.getLogger 'Router'
ExperimentsService = require '../services/ExperimentsService'

router = express.Router()

handleCatch = (res, err) ->
  if err.validationMessages?
    res.status(400).json err
  else
    logger.error err
    res.status(500).json message: err

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

router.post '/experiment', (req, res) ->
  experiment = req.body
  new ExperimentsService().createExperiment experiment
  .then (id) ->
    res.json id: id
  .catch (err) ->
    handleCatch res, err


module.exports = router


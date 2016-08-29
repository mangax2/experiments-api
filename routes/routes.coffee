express = require 'express'
log4js = require 'log4js'
logger = log4js.getLogger 'Router'
ExperimentsService = require '../services/ExperimentsService'
ExperimentModelService = require '../services/ExperimentModelService'


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

router.post '/experiments', (req, res) ->
  experiment = req.body
  new ExperimentsService().createExperiment experiment
  .then (id) ->
    res.json id
  .catch (err) ->
    handleCatch res, err

router.put '/experiments/:id', (req, res) ->
  experiment = req.body
  id = req.params.id
  new ExperimentsService().updateExperiment id, experiment
  .then (value) ->
    res.json value
  .catch (err) ->
    handleCatch res, err


router.delete '/experiments/:id', (req, res) ->
  id = req.params.id
  new ExperimentsService().deleteExperiment id
  .then (value) ->
    res.json value
  .catch (err) ->
    handleCatch res, err


router.get '/experimentModel', (req, res) ->
  new ExperimentModelService().getAllModels()
  .then (r) ->
    res.json r
  .catch (err) ->
    handleCatch res, err

router.get '/experimentModel/:id', (req, res) ->
  id = req.params.id
  new ExperimentModelService().getExperimentModelById id
  .then (experimentModel) ->
    res.json experimentModel
  .catch (err) ->
    handleCatch res, err

router.post '/experimentModel', (req, res) ->
  experimentModel = req.body
  new ExperimentModelService().createExperimentModel experimentModel
  .then (id) ->
    res.json id
  .catch (err) ->
    handleCatch res, err

router.put '/experimentModel/:id', (req, res) ->
  experimentModel = req.body
  id = req.params.id
  new ExperimentModelService().updateExperimentModel id, experimentModel
  .then (value) ->
    res.json value
  .catch (err) ->
    handleCatch res, err


router.delete '/experimentModel/:id', (req, res) ->
  id = req.params.id
  new ExperimentModelService().deleteExperimentModel id
  .then (value) ->
    res.json value
  .catch (err) ->
    handleCatch res, err

module.exports = router


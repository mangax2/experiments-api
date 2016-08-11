db = require '../db/DbManager'
log4js = require 'log4js'
logger = log4js.getLogger 'ExperimentsService'
_ = require 'underscore'

class ExperimentsService

  createExperiment: (experiment)=>
    new Promise (resolve, reject) =>
      db.experiments.repository().tx 'tx1', (t) ->
        resolve db.experiments.create(t,experiment)

  getAllExperiments: =>
    new Promise (resolve, reject) =>
      data = db.experiments.all()
      resolve data

  getExperimentById: (id) =>
    new Promise (resolve, reject) =>
       db.experiments.find (id)
       .then (data) =>
         if(not data?)
          throw validationMessages: ["Experiment Not Found for requested experimentId"]
         else
          resolve data
       .catch (err) =>
         reject err

  deleteExperiment: (id)=>
    new Promise (resolve, reject) =>
      db.experiments.repository().tx 'tx1', (t) ->
        data = db.experiments.delete(t, id)
        resolve id

module.exports = ExperimentsService

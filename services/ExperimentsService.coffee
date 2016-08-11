db = require '../db/DbManager'
log4js = require 'log4js'
logger = log4js.getLogger 'ExperimentsService'
_ = require 'underscore'

class ExperimentsService

  getAllExperiments: =>
    new Promise (resolve, reject) =>
      data = db.experiments.all()
      resolve data

#  TODO fix create call
  createExperiment: (experiment)=>
    new Promise (resolve, reject) =>
      db.experiments.gRep().tx 'tx1', (t) ->
        resolve db.experiments.create(t,experiment)


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

module.exports = ExperimentsService

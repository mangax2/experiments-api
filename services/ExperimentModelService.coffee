db = require '../db/DbManager'
log4js = require 'log4js'
logger = log4js.getLogger 'ExperimentsModelService'
_ = require 'underscore'

class ExperimentModelService



  getAllModels: =>
    new Promise (resolve, reject) =>
      console.log("service get")
      data = db.experimentModel.all()
      console.log(data)
      resolve data


  getExperimentModelById: (id) =>
    new Promise (resolve, reject) =>
      db.experimentModel.find (id)
      .then (data) =>
        if(not data?)
          throw validationMessages: ["ExperimentModel Not Found for requested experimentModelId"]
        else
          resolve data
      .catch (err) =>
        reject err

  createExperimentModel: (experimentModel)=>
    console.log(experimentModel)
    console.log("service")
    new Promise (resolve, reject) =>
      db.experimentModel.repository().tx 'txModelCreate', (t) ->
        resolve db.experimentModel.create(t,experimentModel)

  deleteExperimentModel: (id)=>
    new Promise (resolve, reject) =>
      db.experimentModel.repository().tx 'txModelDelete', (t) ->
        data = db.experimentModel.delete(t, id)
        resolve id

module.exports = ExperimentModelService

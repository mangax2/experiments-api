db = require '../db/DbManager'
log4js = require 'log4js'
logger = log4js.getLogger 'ExperimentsModelService'
_ = require 'underscore'

class ExperimentModelService



  getAllModels: =>
    new Promise (resolve, reject) =>
      data = db.experimentModel.all()
      resolve data

module.exports = ExperimentModelService

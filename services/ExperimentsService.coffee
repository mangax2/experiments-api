db = require '../db/DbManager'
log4js = require 'log4js'
logger = log4js.getLogger 'ExperimentsService'
_ = require 'underscore'

class ExperimentsService

  getAllExperiments: =>

    new Promise (resolve, reject) =>
      data = db.experiments.all()
      resolve data


  getExperimentById: (id) =>

    new Promise (resolve, reject) =>
      data = db.experiments.find (1)
      resolve data




module.exports = ExperimentsService

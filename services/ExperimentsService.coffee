ConnectionManager = require '../db/ConnectionManager'
ExperimentDao = require '../dao/ExperimentDao'
log4js = require 'log4js'
logger = log4js.getLogger 'ExperimentsService'
_ = require 'underscore'

class ExperimentsService extends ConnectionManager

  getAllExperiments: =>

    new Promise (resolve, reject) =>

      {conn} = {}

      @getConnection()
      .then (c) =>
        console.log("connection resolved")
        conn = c
        new ExperimentDao(conn).getAll()
      .then (experiments) =>
        @releaseConnection(conn)
        .then =>
          resolve experiments
      .catch (err) =>
        @releaseConection(conn)
        logger.error "Error: #{err}"
        reject err

  getExperimentById: (id) =>

    new Promise (resolve, reject) =>
      {conn} = {}

      @getConnection()
      .then (c) =>
        console.log("connection resolved")
        conn = c
        new ExperimentDao(conn).getById id
      .then (experiments) =>
        @releaseConnection conn
        .then =>
          if(experiments.length==0)
            throw validationMessages: ["Experiment Not Found for requested experimentId"]
          else
            resolve experiments[0]
      .catch (err) =>
        @releaseConnection conn
        reject err




module.exports = ExperimentsService

  promise = require 'bluebird'
  experiments = require '../repos/experiments'
  experimentModel = require '../repos/experimentModel'
  pgPromise = require 'pg-promise'
  cfServices = require '../services/utility/ServiceConfig'
  log4js = require 'log4js'
  logger = log4js.getLogger 'DbManager'

  # pg-promise initialization options:
  options =
    promiseLib: promise
    extend: (obj) ->
      obj.experiments = new (experiments)(obj, pgp)
      obj.experimentModel = new (experimentModel)(obj, pgp)
      return
  # Database connection parameters:
  config = cfServices.experimentsDataSource
  logger.debug 'loaded db connection config'

  pgp = pgPromise(options)
  # Create the database instance with extensions:
  db = pgp(config)
#  {
#    pgp: pgp
#    db: db
#  }

  module.exports = db

  promise = require 'bluebird'
  experiments = require '../repos/experiments'
  pgPromise = require 'pg-promise'
  cfServices = require '../services/utility/ServiceConfig'
  log4js = require 'log4js'
  logger = log4js.getLogger 'DbManager'

  # pg-promise initialization options:
  options =
    promiseLib: promise
    extend: (obj) ->
      obj.experiments = new (experiments)(obj, pgp)
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
# ---
# generated by js2coffee 2.2.0

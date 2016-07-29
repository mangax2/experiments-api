testing = process.env.NODE_ENV == 'UNITTEST'
if testing
  module.exports = require '../test/db/TestDatabase'
else
  pg = require 'pg'
  cfServices = require '../services/utility/ServiceConfig'
  dsConfig = cfServices.experimentsDataSource
  # uncomment below line to enable debugging for connection pool
  #dsConfig['log'] = (str) -> console.log str
  pool = new pg.Pool dsConfig
  log4js = require 'log4js'
  logger = log4js.getLogger 'ConnectionPool'

  sql = require 'sql'
  sql.setDialect 'postgres'
  entities = require('../db/entities')(sql)

  logger.info 'connection pool initialized'

  module.exports = {pool,entities}

{pool} = require '../db/ConnectionPool'
log4js = require 'log4js'
logger = log4js.getLogger 'ConnectionManager'

class ConnectionManager
  # If the connection is passed, then connection is managed externally
  constructor: (@connection, @errorOccurred = false) ->

  getConnection: =>
    new Promise (resolve, reject) =>
      if @connection?
        logger.debug 'using existing connection'
        resolve @connection
      else
        logger.debug 'getting connection from pool'
        pool.connect().then (conn) =>
          conn.query 'BEGIN', (err) =>
            if err?
              logger.error 'Could not begin transaction' + err
              reject err
            else
              logger.debug 'transaction started'
              resolve conn

  releaseConnection: (conn) =>
    new Promise (resolve, reject) =>
      if @connection?
        resolve()
      else
        if @errorOccurred
          conn.release()
          resolve()
        else
          conn.query 'COMMIT', (err) =>
            if err?
              logger.error "transaction could not be committed: #{err}"
            else
              logger.debug 'transaction committed'
            conn.release()
            logger.debug 'connection released to pool'
            resolve()

  rollback: (conn) =>
    @errorOccurred = true
    new Promise (resolve, reject) =>
      if @connection
        resolve()
      else
        conn.query 'ROLLBACK', (err) =>
          if err?
            logger.error 'transaction could not be rolled back'
          else
            logger.debug 'transaction rolled back'
          @releaseConnection(conn).then =>
            resolve()

module.exports = ConnectionManager

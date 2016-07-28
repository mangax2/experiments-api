ConnectionManager = require '../db/ConnectionManager'
moment = require 'moment'
log4js = require 'log4js'
logger = log4js.getLogger 'AbstractDao'

class AbstractDao extends ConnectionManager
  constructor: (connection) ->
    super connection

  # will return a promise which will resolve to the fully created record with the id populated
  create: (entity, object, {primaryKey, user, createdUserColumn, createdTimeColumn, modifiedUserColumn, modifiedTimeColumn} = {}) ->
    primaryKey ?= 'id'
    time = @_currentTime()
    if user? and createdUserColumn then object[createdUserColumn] = user.toUpperCase()
    if createdTimeColumn? then object[createdTimeColumn] = time
    if user? and modifiedUserColumn then object[modifiedUserColumn] = user.toUpperCase()
    if modifiedTimeColumn? then object[modifiedTimeColumn] = time
    query = entity.insert(object).returning(entity[primaryKey]).toQuery()
    new Promise (resolve, reject) =>
      @executeQuery query
      .then (rows) ->
        resolve rows[0][primaryKey]
      .catch (err) ->
        reject err

  getById: (entity, id, {primaryKey} = {}) ->
    primaryKey ?= 'id'
    query = entity.select entity.star()
      .from entity
      .where entity[primaryKey].equals id
      .toQuery()
    @executeQuery query

  update: (entity, object, {primaryKey, user, modifiedUserColumn, modifiedTimeColumn} = {}) ->
    primaryKey ?= 'id'
    if user? and modifiedUserColumn then object[modifiedUserColumn] = user.toUpperCase()
    if modifiedTimeColumn? then object[modifiedTimeColumn] = @_currentTime()
    query = entity.update(object)
      .where( entity[primaryKey].equals(object[primaryKey]) )
      .toQuery()
    @executeQuery query

  delete: (entity, id, {primaryKey} = {}) ->
    primaryKey ?= 'id'
    obj = {}
    obj[primaryKey] = id
    query = entity.delete(obj).toQuery()
    @executeQuery query

  executeQuery: (query) =>
    console.log("in executeQuery")
    new Promise (resolve, reject) =>
      {returnValue, conn} = {}
      @getConnection()
      .then (c) =>
        conn = c
        logger.debug "executing query: #{query.text}"
        conn.query(query)
      .then (result) =>
        if result?
          if result.rows?
            returnValue = result.rows
          else
            returnValue = result
        @releaseConnection(conn)
      .then ->
        logger.debug 'successful query execution'
        if returnValue?
          resolve returnValue
        else
          resolve()
      .catch (err) =>
        logger.error "Exception while executing query #{query.text}: #{err}"
        @rollback(conn).then ->
          reject err

  _currentTime: ->
    moment().format 'YYYY-MM-DD HH:mm:ss.SSS'

module.exports = AbstractDao

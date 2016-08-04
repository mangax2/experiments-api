{entities} = require '../db/ConnectionPool'
AbstractDao = require './AbstractDao'
entity = entities.experiments

class ExperimentDao extends AbstractDao
  constructor: (connection) -> super connection

  getById: (id) ->
    query = entity.select entity.star()
      .from entity
      .where( entity.id.equals(id) )
      .toQuery()
    @executeQuery query

  getAll: ->
    query = entity.select entity.star()
      .from entity
      .toQuery()
    @executeQuery query


module.exports = ExperimentDao


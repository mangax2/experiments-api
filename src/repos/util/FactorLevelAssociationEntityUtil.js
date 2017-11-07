import _ from 'lodash'

function assembleAssociationsGroupByAssociatedLevelId(factorLevelAssociationDbEntities) {
  return _.groupBy(factorLevelAssociationDbEntities, 'associated_level_id')
}

function assembleAssociationsGroupedByNestedLevelId(factorLevelAssociationDbEntities) {
  return _.groupBy(factorLevelAssociationDbEntities, 'nested_level_id')
}

function getNestedFactorIds(
  factorLevelDbEntities,
  associationDbEntitiesGroupedByAssociatedLevelId,
  factorLevelHashById) {
  return _.uniq(_.flatMap(factorLevelDbEntities,
    (factorLevel) => {
      const associations =
        associationDbEntitiesGroupedByAssociatedLevelId[factorLevel.id]
      if (!_.isEmpty(associations)) {
        return _.map(associations, association =>
          factorLevelHashById[association.nested_level_id].factor_id)
      }
      return []
    }))
}

function getAssociatedFactorIds(
  factorLevelDbEntities,
  associationDbEntitiesGroupedByNestedLevelId,
  factorLevelHashById) {
  return _.uniq(_.flatMap(factorLevelDbEntities,
    (factorLevel) => {
      const associations =
        associationDbEntitiesGroupedByNestedLevelId[factorLevel.id]
      if (!_.isEmpty(associations)) {
        return _.map(associations, association =>
          factorLevelHashById[association.associated_level_id].factor_id)
      }
      return []
    }))
}

module.exports = {
  assembleAssociationsGroupByAssociatedLevelId,
  assembleAssociationsGroupedByNestedLevelId,
  getNestedFactorIds,
  getAssociatedFactorIds,
}
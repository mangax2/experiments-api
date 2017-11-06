import _ from 'lodash'

function assembleAssociationsGroupByAssociatedLevelId(factorLevelAssociationEntities) {
  return _.groupBy(factorLevelAssociationEntities, 'associated_level_id')
}

function assembleAssociationsGroupedByNestedLevelId(factorLevelAssociationEntities) {
  return _.groupBy(factorLevelAssociationEntities, 'nested_level_id')
}

function getNestedFactorIds(
  factorLevels,
  associationsGroupedByAssociatedLevelId,
  factorLevelHashById) {
  return _.uniq(_.flatMap(factorLevels,
    (factorLevel) => {
      const associations =
        associationsGroupedByAssociatedLevelId[factorLevel.id]
      if (!_.isEmpty(associations)) {
        return _.map(associations, association =>
          factorLevelHashById[association.nested_level_id].factor_id)
      }
      return []
    }))
}

function getAssociatedFactorIds(
  factorLevels,
  associationsGroupedByNestedLevelId,
  factorLevelHashById) {
  return _.uniq(_.flatMap(factorLevels,
    (factorLevel) => {
      const associations =
        associationsGroupedByNestedLevelId[factorLevel.id]
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
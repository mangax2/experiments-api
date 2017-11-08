import _ from 'lodash'

function assembleFactorLevelHashById(factorLevelDbEntities) {
  return _.keyBy(factorLevelDbEntities, 'id')
}

module.exports = {
  assembleFactorLevelHashById
}
import _ from 'lodash'

function assembleFactorLevelHashById(factorLevels) {
  return _.keyBy(factorLevels, 'id')
}

module.exports = {
  assembleFactorLevelHashById
}
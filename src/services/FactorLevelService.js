import { dbRead } from '../db/DbManager'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1CXXXX
class FactorLevelService {
  @setErrorCode('1C3000')
  static getFactorLevelsByExperimentIdNoExistenceCheck(id) {
    return dbRead.factorLevel.findByExperimentId(id)
  }
}

module.exports = FactorLevelService

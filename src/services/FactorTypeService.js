import db from '../db/DbManager'
import FactorTypesValidator from '../validations/FactorTypesValidator'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1EXXXX
class FactorTypeService {
  constructor() {
    this.validator = new FactorTypesValidator()
  }

  @setErrorCode('1E1000')
  createFactorType(factorType, context) {
    return this.validator.validate([factorType])
      .then(() => db.factorType.repository().tx('createFactorType', tx =>
        db.factorType.create(tx, factorType, context)))
  }
}

module.exports = FactorTypeService

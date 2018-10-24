import db from '../db/DbManager'
import FactorTypesValidator from '../validations/FactorTypesValidator'
import AppError from './utility/AppError'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

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

  @setErrorCode('1E2000')
  getAllFactorTypes = () => db.factorType.all()

  @setErrorCode('1E3000')
  getFactorTypeById = id => db.factorType.find(id)
    .then((data) => {
      if (!data) {
        throw AppError.notFound('Factor Type Not Found', undefined, getFullErrorCode('1E3001'))
      } else {
        return data
      }
    })
}

module.exports = FactorTypeService

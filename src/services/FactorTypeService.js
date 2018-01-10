import db from '../db/DbManager'
import FactorTypesValidator from '../validations/FactorTypesValidator'
import AppError from './utility/AppError'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

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

  @setErrorCode('1E4000')
  updateFactorType(id, factorType, context) {
    return this.validator.validate([factorType])
      .then(() => db.factorType.repository().tx('updateFactorType', tx =>
        db.factorType.update(tx, id, factorType, context)
          .then((data) => {
            if (!data) {
              throw AppError.notFound('Factor Type Not Found', undefined, getFullErrorCode('1E4001'))
            } else {
              return data
            }
          })))
  }

  @setErrorCode('1E5000')
  deleteFactorType = id => db.factorType.repository().tx('deleteFactorType', tx =>
    db.factorType.delete(tx, id)
      .then((data) => {
        if (!data) {
          throw AppError.notFound('Factor Type Not Found', undefined, getFullErrorCode('1E5001'))
        } else {
          return data
        }
      }),
  )
}

module.exports = FactorTypeService

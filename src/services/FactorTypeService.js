import db from '../db/DbManager'
import FactorTypesValidator from '../validations/FactorTypesValidator'
import AppError from './utility/AppError'

class FactorTypeService {
  constructor() {
    this.validator = new FactorTypesValidator()
  }

  createFactorType(factorType, context) {
    return this.validator.validate([factorType])
      .then(() => db.factorType.repository().tx('createFactorType', tx =>
        db.factorType.create(tx, factorType, context)))
  }

  getAllFactorTypes = () => db.factorType.all()

  getFactorTypeById = id => db.factorType.find(id)
    .then((data) => {
      if (!data) {
        throw AppError.notFound('Factor Type Not Found')
      } else {
        return data
      }
    })

  updateFactorType(id, factorType, context) {
    return this.validator.validate([factorType])
      .then(() => db.factorType.repository().tx('updateFactorType', tx =>
        db.factorType.update(tx, id, factorType, context)
          .then((data) => {
            if (!data) {
              throw AppError.notFound('Factor Type Not Found')
            } else {
              return data
            }
          })))
  }

  deleteFactorType = id => db.factorType.repository().tx('deleteFactorType', tx =>
    db.factorType.delete(tx, id)
      .then((data) => {
        if (!data) {
          throw AppError.notFound('Factor Type Not Found')
        } else {
          return data
        }
      }),
  )
}

module.exports = FactorTypeService

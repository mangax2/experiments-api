import db from '../db/DbManager'
import FactorTypesValidator from '../validations/FactorTypesValidator'
import AppError from './utility/AppError'

class FactorTypeService {
  constructor() {
    this._validator = new FactorTypesValidator()
  }

  createFactorType(factorType, context) {
    return this._validator.validate([factorType]).then(() => db.factorType.repository().tx('createFactorType', tx => db.factorType.create(tx, factorType, context)))
  }

  getAllFactorTypes() {
    return db.factorType.all()
  }

  getFactorTypeById(id) {
    return db.factorType.find(id).then((data) => {
      if (!data) {
        throw AppError.notFound('Factor Type Not Found')
      } else {
        return data
      }
    })
  }

  updateFactorType(id, factorType, context) {
    return this._validator.validate([factorType]).then(() => db.factorType.repository().tx('updateFactorType', tx => db.factorType.update(tx, id, factorType, context).then((data) => {
      if (!data) {
        throw AppError.notFound('Factor Type Not Found')
      } else {
        return data
      }
    })))
  }

  deleteFactorType(id) {
    return db.factorType.repository().tx('deleteFactorType', tx => db.factorType.delete(tx, id).then((data) => {
      if (!data) {
        throw AppError.notFound('Factor Type Not Found')
      } else {
        return data
      }
    }))
  }
}

module.exports = FactorTypeService

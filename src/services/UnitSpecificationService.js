import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'

const logger = log4js.getLogger('UnitSpecificationService')

class UnitSpecificationService {
  getUnitSpecificationById = id => db.unitSpecification.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`Unit Specification Not Found for requested id = ${id}`)
        throw AppError.notFound('Unit Specification Not Found for requested id')
      } else {
        return data
      }
    })

  getAllUnitSpecifications = () => db.unitSpecification.all()
}

module.exports = UnitSpecificationService

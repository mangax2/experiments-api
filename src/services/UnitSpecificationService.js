import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('UnitSpecificationService')

// Error Codes 1TXXXX
class UnitSpecificationService {
  @setErrorCode('1T1000')
  getUnitSpecificationById = (id, context) => db.unitSpecification.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Unit Specification Not Found for requested id = ${id}`)
        throw AppError.notFound('Unit Specification Not Found for requested id', undefined, getFullErrorCode('1T1001'))
      } else {
        return data
      }
    })

  @setErrorCode('1T2000')
  getAllUnitSpecifications = () => db.unitSpecification.all()
}

module.exports = UnitSpecificationService

import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import { getFullErrorCode, setErrorCode } from '../decorators/setErrorDecorator'

const logger = log4js.getLogger('UnitTypeService')

// Error Codes 1UXXXX
class UnitTypeService {
  @setErrorCode('1U1000')
  getUnitTypeById = (id, context) => db.unitType.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Unit Type Not Found for requested id = ${id}`)
        throw AppError.notFound('Unit Type Not Found for requested id', undefined, getFullErrorCode('1U1001'))
      } else {
        return data
      }
    })

  @setErrorCode('1U2000')
  getAllUnitTypes = () => db.unitType.all()
}

module.exports = UnitTypeService

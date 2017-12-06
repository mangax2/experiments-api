import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'

const logger = log4js.getLogger('UnitTypeService')

class UnitTypeService {
  getUnitTypeById = (id, context) => db.unitType.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Unit Type Not Found for requested id = ${id}`)
        throw AppError.notFound('Unit Type Not Found for requested id')
      } else {
        return data
      }
    })

  getAllUnitTypes = () => db.unitType.all()
}

module.exports = UnitTypeService

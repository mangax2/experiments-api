import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import { getFullErrorCode, setErrorCode } from '../decorators/setErrorDecorator'

const logger = log4js.getLogger('GroupTypeService')

// Error Codes 1HXXXX
class GroupTypeService {
  @setErrorCode('1H1000')
  getGroupTypeById = (id, context) => db.groupType.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Group Type Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Type Not Found for requested id', undefined, getFullErrorCode('1H1001'))
      } else {
        return data
      }
    })

  @setErrorCode('1H2000')
  getAllGroupTypes = () => db.groupType.all()
}

module.exports = GroupTypeService

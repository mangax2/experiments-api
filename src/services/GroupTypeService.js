import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'

const logger = log4js.getLogger('GroupTypeService')

class GroupTypeService {
  getGroupTypeById = id => db.groupType.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`Group Type Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Type Not Found for requested id')
      } else {
        return data
      }
    })

  getAllGroupTypes = () => db.groupType.all()
}

module.exports = GroupTypeService

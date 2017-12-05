import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import GroupValueValidator from '../validations/GroupValueValidator'
import GroupService from './GroupService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('GroupValueService')

class GroupValueService {
  constructor() {
    this.validator = new GroupValueValidator()
    this.groupService = new GroupService()
  }

  @Transactional('createGroupValueTx')
  batchCreateGroupValues(groupValues, context, tx) {
    return this.validator.validate(groupValues, 'POST', tx)
      .then(() => db.groupValue.batchCreate(groupValues, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('batchGetGroupValuesByExperimentId')
  batchGetGroupValuesByExperimentId = (id, tx) =>
    db.groupValue.batchFindAllByExperimentId(id, tx)

  @Transactional('getGroupValueById')
  getGroupValueById = (id, context, tx) => db.groupValue.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Group Value Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Value Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchUpdateGroupValues')
  batchUpdateGroupValues(groupValues, context, tx) {
    return this.validator.validate(groupValues, 'PUT', tx)
      .then(() => db.groupValue.batchUpdate(groupValues, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }
}

module.exports = GroupValueService

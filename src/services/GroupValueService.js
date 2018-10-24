import log4js from 'log4js'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import GroupValueValidator from '../validations/GroupValueValidator'
import GroupService from './GroupService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('GroupValueService')

// Error Codes 1IXXXX
class GroupValueService {
  constructor() {
    this.validator = new GroupValueValidator()
    this.groupService = new GroupService()
  }

  @setErrorCode('1I1000')
  @Transactional('createGroupValueTx')
  batchCreateGroupValues(groupValues, context, tx) {
    return this.validator.validate(groupValues, 'POST', tx)
      .then(() => db.groupValue.batchCreate(groupValues, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1I2000')
  @Transactional('batchGetGroupValuesByExperimentId')
  batchGetGroupValuesByExperimentId = (id, tx) =>
    db.groupValue.batchFindAllByExperimentId(id, tx)

  @setErrorCode('1I3000')
  @Transactional('getGroupValueById')
  getGroupValueById = (id, context, tx) => db.groupValue.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Group Value Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Value Not Found for requested id', undefined, getFullErrorCode('1I3001'))
      } else {
        return data
      }
    })

  @setErrorCode('1I4000')
  @Transactional('batchUpdateGroupValues')
  batchUpdateGroupValues(groupValues, context, tx) {
    return this.validator.validate(groupValues, 'PUT', tx)
      .then(() => db.groupValue.batchUpdate(groupValues, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }
}

module.exports = GroupValueService

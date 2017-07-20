import log4js from 'log4js'
import _ from 'lodash'
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

  @Transactional('getGroupValuesByGroupId')
  getGroupValuesByGroupId(id, tx) {
    return this.groupService.getGroupById(id, tx)
      .then(() => db.groupValue.findAllByGroupId(id, tx))
  }

  @Transactional('batchGetGroupValuesByGroupIds')
  batchGetGroupValuesByGroupIds(ids, tx) {
    return this.groupService.batchGetGroupsByIds(ids, tx)
      .then(() => db.groupValue.batchFindAllByGroupIds(ids, tx))
  }

  @Transactional('batchGetGroupValuesByExperimentId')
  batchGetGroupValuesByExperimentId = (id, tx) =>
    db.groupValue.batchFindAllByExperimentId(id, tx)

  @Transactional('batchGetGroupValuesByGroupIdsNoValidate')
  batchGetGroupValuesByGroupIdsNoValidate = (ids, tx) =>
    db.groupValue.batchFindAllByGroupIds(ids, tx)

  @Transactional('getGroupValueById')
  getGroupValueById = (id, tx) => db.groupValue.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Group Value Not Found for requested id = ${id}`)
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

  @Transactional('deleteGroupValue')
  deleteGroupValue = (id, tx) => db.groupValue.remove(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Group Value Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Value Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchDeleteGroupValues')
  batchDeleteGroupValues = (ids, tx) => db.groupValue.batchRemove(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error('Not all group values requested for delete were found')
        throw AppError.notFound('Not all group values requested for delete were found')
      } else {
        return data
      }
    })
}

module.exports = GroupValueService

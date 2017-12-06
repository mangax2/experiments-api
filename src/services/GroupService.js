import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import GroupValidator from '../validations/GroupValidator'

import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('GroupService')

class GroupService {
  constructor() {
    this.validator = new GroupValidator()
    this.experimentService = new ExperimentsService()
  }

  @Transactional('batchCreateGroups')
  batchCreateGroups(groups, context, tx) {
    return this.validator.validate(groups, 'POST', tx)
      .then(() => db.group.batchCreate(groups, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('getGroupsByExperimentId')
  getGroupsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.group.findAllByExperimentId(id, tx))
  }

  @Transactional('getGroupsById')
  getGroupById = (id, context, tx) => db.group.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Group Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchUpdateGroups')
  batchUpdateGroups(groups, context, tx) {
    return this.validator.validate(groups, 'PUT', tx)
      .then(() => db.group.batchUpdate(groups, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('batchUpdateGroups')
  batchUpdateGroupsNoValidate = (groups, context, tx) =>
    db.group.batchUpdate(groups, context, tx)

  @Transactional('partiallyUpdateGroup')
  partiallyUpdateGroup = (groups, context, tx) =>
    this.validator.validate(groups, 'PATCH', tx)
      .then(() => db.group.partiallyUpdate(groups, context, tx))

  @Transactional('batchDeleteGroups')
  batchDeleteGroups = (ids, context, tx) => db.group.batchRemove(ids, tx)
    .then((data) => {
      if (_.compact(data).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Not all groups requested for delete were found`)
        throw AppError.notFound('Not all groups requested for delete were found')
      } else {
        return data
      }
    })
}

module.exports = GroupService

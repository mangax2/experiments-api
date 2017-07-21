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
  getGroupsByExperimentId(id, tx) {
    return this.experimentService.getExperimentById(id, tx)
      .then(() => db.group.findAllByExperimentId(id, tx))
  }

  @Transactional('getGroupsByIds')
  batchGetGroupsByIds = (ids, tx) => db.group.batchFind(ids, tx)
    .then((data) => {
      if (_.filter(data, element => element !== null).length !== ids.length) {
        logger.error('Group not found for all requested ids.')
        throw AppError.notFound('Group not found for all requested ids.')
      } else {
        return data
      }
    })

  @Transactional('getGroupsById')
  getGroupById = (id, tx) => db.group.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Group Not Found for requested id = ${id}`)
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

  @Transactional('deleteGroup')
  deleteGroup = (id, tx) => db.group.remove(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Group Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchDeleteGroups')
  batchDeleteGroups = (ids, tx) => db.group.batchRemove(ids, tx)
    .then((data) => {
      if (_.compact(data).length !== ids.length) {
        logger.error('Not all groups requested for delete were found')
        throw AppError.notFound('Not all groups requested for delete were found')
      } else {
        return data
      }
    })
}

module.exports = GroupService

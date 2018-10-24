import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import GroupValidator from '../validations/GroupValidator'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('GroupService')

// Error Codes 1GXXXX
class GroupService {
  constructor() {
    this.validator = new GroupValidator()
    this.experimentService = new ExperimentsService()
  }

  @setErrorCode('1G1000')
  @Transactional('batchCreateGroups')
  batchCreateGroups(groups, context, tx) {
    return this.validator.validate(groups, 'POST', tx)
      .then(() => db.group.batchCreate(groups, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('1G2000')
  @Transactional('getGroupsByExperimentId')
  getGroupsByExperimentId(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.group.findAllByExperimentId(id, tx))
  }

  @setErrorCode('1G3000')
  @Transactional('getGroupsById')
  getGroupById = (id, context, tx) => db.group.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Group Not Found for requested id = ${id}`)
        throw AppError.notFound('Group Not Found for requested id', undefined, getFullErrorCode('1G3001'))
      } else {
        return data
      }
    })

  @setErrorCode('1G4000')
  @Transactional('batchUpdateGroups')
  batchUpdateGroups(groups, context, tx) {
    return this.validator.validate(groups, 'PUT', tx)
      .then(() => db.group.batchUpdate(groups, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @setErrorCode('1G6000')
  @Transactional('partiallyUpdateGroup')
  partiallyUpdateGroup = (groups, context, tx) =>
    this.validator.validate(groups, 'PATCH', tx)
      .then(() => db.group.partiallyUpdate(groups, context, tx))

  @setErrorCode('1G7000')
  @Transactional('batchDeleteGroups')
  batchDeleteGroups = (ids, context, tx) => db.group.batchRemove(ids, tx)
    .then((data) => {
      if (_.compact(data).length !== ids.length) {
        logger.error(`[[${context.requestId}]] Not all groups requested for delete were found`)
        throw AppError.notFound('Not all groups requested for delete were found', undefined, getFullErrorCode('1G7001'))
      } else {
        return data
      }
    })
}

module.exports = GroupService

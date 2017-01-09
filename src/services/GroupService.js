import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import GroupValidator from '../validations/GroupValidator'
import log4js from 'log4js'
import _ from 'lodash'

import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('GroupService')

class GroupService {

    constructor() {
        this._validator = new GroupValidator()
        this._experimentService = new ExperimentsService()
    }

    @Transactional('batchCreateGroups')
    batchCreateGroups(groups, context, tx) {
        return this._validator.validate(groups, 'POST', tx).then(() => {
            return db.group.batchCreate(groups, context, tx).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }


    @Transactional('getGroupsByExperimentId')
    getGroupsByExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(()=> {
            return db.group.findAllByExperimentId(id, tx)
        })
    }

    @Transactional('getGroupsByIds')
    batchGetGroupstByIds(ids, tx) {
        return db.group.batchFind(ids, tx).then((data) => {
            if (_.filter(data, (element) => element != null).length != ids.length) {
                logger.error('Group not found for all requested ids.')
                throw AppError.notFound('Group not found for all requested ids.')
            } else {
                return data
            }
        })
    }

    @Transactional('getGroupsById')
    getGroupById(id, tx) {
        return db.group.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Group Not Found for requested id = ' + id)
                throw AppError.notFound('Group Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchUpdateGroups')
    batchUpdateGroups(groups, context, tx) {
        return this._validator.validate(groups, 'PUT', tx).then(() => {
            return db.group.batchUpdate(groups, context, tx).then(data => {
                return AppUtil.createPutResponse(data)
            })
        })
    }

    @Transactional('deleteGroup')
    deleteGroup(id, tx) {
        return db.group.remove(id, tx).then((data) => {
            if (!data) {
                logger.error('Group Not Found for requested id = ' + id)
                throw AppError.notFound('Group Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('deleteGroupsForExperimentId')
    deleteGroupsForExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(() => {
            return db.group.removeByExperimentId(id, tx)
        })
    }
}

module.exports = GroupService
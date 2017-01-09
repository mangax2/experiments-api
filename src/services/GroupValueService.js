import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import GroupValueValidator from '../validations/GroupValueValidator'
// import GroupService from './GroupService'
import log4js from 'log4js'
import _ from 'lodash'
import Transactional from '../decorators/transactional'
// import ctimestamp from 'console-timestamp'

const logger = log4js.getLogger('GroupValueService')

class CombinationElementService {

    constructor() {
        this._validator = new GroupValueValidator()
        // this._groupService = new GroupService()
    }
    //
    @Transactional('createGroupValueTx')
    batchCreateGroupValues(groupValues, context, tx) {
        return this._validator.validate(groupValues, 'POST', tx).then(() => {
            return db.groupValue.batchCreate(groupValues, context, tx).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }


    @Transactional('getGroupValuesByGroupId')
    getGroupValuesByGroupId(id, tx) {
        // return this._groupService.getGroupById(id, tx).then(()=>{
            return db.groupValue.findAllByGroupId(id, tx)
        // })
    }

    @Transactional('batchGetGroupValuesByGroupIds')
    batchGetGroupValuesByGroupIds(ids, tx) {
    //     return this._groupService.batchGetGroupByIds(ids, tx).then(()=>{
            return db.groupValue.batchFindAllByGroupIds(ids, tx)
    //     })
    }

    @Transactional('batchGetGroupValuesByGroupIdsNoValidate')
    batchGetGroupValuesByGroupIdsNoValidate(ids, tx) {
        return db.groupValue.batchFindAllByGroupIds(ids, tx)
    }

    @Transactional('getGroupValueById')
    getGroupValueById(id, tx) {
        return db.groupValue.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Group Value Not Found for requested id = ' + id)
                throw AppError.notFound('Group Value Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchUpdateGroupValues')
    batchUpdateGroupValues(groupValues, context, tx) {
        return this._validator.validate(groupValues, 'PUT', tx).then(() => {
            return db.groupValue.batchUpdate(groupValues, context, tx).then(data => {
                return AppUtil.createPutResponse(data)
            })
        })
    }

    @Transactional('deleteGroupValue')
    deleteGroupValue(id, tx) {
        return db.groupValue.remove(id, tx).then((data) => {
            if (!data) {
                logger.error('Group Value Not Found for requested id = ' + id)
                throw AppError.notFound('Group Value Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchDeleteGroupValues')
    batchDeleteGroupValues(ids, tx) {
        return db.groupValue.batchRemove(ids, tx).then((data) => {
            if (_.filter(data, (element) => element != null).length != ids.length) {
                logger.error('Not all group values requested for delete were found')
                throw AppError.notFound('Not all group values requested for delete were found')
            } else {
                return data
            }
        })
    }
}

module.exports = CombinationElementService
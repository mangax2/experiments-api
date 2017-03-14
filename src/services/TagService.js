import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import TagValidator from '../validations/TagValidator'
import Transactional from '../decorators/transactional'
import log4js from "log4js"
import _ from 'lodash'

const logger = log4js.getLogger('TagService')
class TagService {

    constructor() {
        this._validator = new TagValidator()
        this._experimentService = new ExperimentsService()
    }

    @Transactional('batchCreateTags')
    batchCreateTags(tags, context, tx) {
        return this._validator.validate(tags, 'POST', tx).then(() => {
            return db.tag.batchCreate(tags, context, tx).then(data => {
                return AppUtil.createPostResponse(data)
            })
        })
    }


    @Transactional('getTagsByExperimentId')
    getTagsByExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(()=> {
            return db.tag.findByExperimentId(id, tx)
        })
    }

    @Transactional('getTagById')
    getTagById(id, tx) {
        return db.tag.find(id, tx).then((data) => {
            if (!data) {
                logger.error('Tag Not Found for requested id = ' + id)
                throw AppError.notFound('Tag Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('getTagById')
    batchGetTagByIds(ids, tx) {
        return db.tag.batchFind(ids, tx).then((data) => {
            if (_.filter(data, (element) => element != null).length != ids.length) {
                logger.error('Tag not found for all requested ids.')
                throw AppError.notFound('Tag not found for all requested ids.')
            } else {
                return data
            }
        })
    }

    @Transactional('batchUpdateTags')
    batchUpdateTags(tags, context, tx) {
        return this._validator.validate(tags, 'PUT', tx).then(() => {
            return db.tag.batchUpdate(tags, context, tx).then(data => {
                return AppUtil.createPutResponse(data)
            })
        })
    }

    @Transactional('deleteTag')
    deleteTag(id, tx) {
        return db.tag.remove(id, tx).then((data) => {
            if (!data) {
                logger.error('Tag Not Found for requested id = ' + id)
                throw AppError.notFound('Tag Not Found for requested id')
            } else {
                return data
            }
        })
    }

    @Transactional('batchDeleteTags')
    batchDeleteTags(ids, tx) {
        return db.tag.batchRemove(ids, tx).then((data) => {
            if (_.filter(data, (element) => element != null).length != ids.length) {
                logger.error('Not all tags requested for delete were found')
                throw AppError.notFound('Not all tags requested for delete were found')
            } else {
                return data
            }
        })
    }

    @Transactional('deleteTagsForExperimentId')
    deleteTagsForExperimentId(id, tx) {
        return this._experimentService.getExperimentById(id, tx).then(() => {
            return db.tag.removeByExperimentId(id, tx)
        })
    }

}

module.exports =  TagService
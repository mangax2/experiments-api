import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import TagValidator from '../validations/TagValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('TagService')
class TagService {

  constructor() {
    this._validator = new TagValidator()
  }

  @Transactional('batchCreateTags')
  batchCreateTags(tags, context, tx) {
    return this._validator.validate(tags, 'POST', tx).then(() => db.tag.batchCreate(tags, context, tx).then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('getTagsByExperimentId')
  getTagsByExperimentId(id, tx) {
    return db.tag.findByExperimentId(id, tx)
  }

  @Transactional('getTagById')
  getTagById(id, tx) {
    return db.tag.find(id, tx).then((data) => {
      if (!data) {
        logger.error(`Tag Not Found for requested id = ${id}`)
        throw AppError.notFound('Tag Not Found for requested id')
      } else {
        return data
      }
    })
  }

  @Transactional('batchGetTagByIds')
  batchGetTagByIds(ids, tx) {
    return db.tag.batchFind(ids, tx)
  }

  @Transactional('batchUpdateTags')
  batchUpdateTags(tags, context, tx) {
    return this._validator.validate(tags, 'PUT', tx).then(() => db.tag.batchUpdate(tags, context, tx).then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('deleteTag')
  deleteTag(id, tx) {
    return db.tag.remove(id, tx).then((data) => {
      if (!data) {
        logger.error(`Tag Not Found for requested id = ${id}`)
        throw AppError.notFound('Tag Not Found for requested id')
      } else {
        return data
      }
    })
  }

  @Transactional('batchDeleteTags')
  batchDeleteTags(ids, tx) {
    return db.tag.batchRemove(ids, tx)
  }

  @Transactional('deleteTagsForExperimentId')
  deleteTagsForExperimentId(id, tx) {
    return db.tag.removeByExperimentId(id, tx)
  }

}

module.exports = TagService

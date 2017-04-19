import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import TagValidator from '../validations/TagValidator'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('TagService')
class TagService {

  constructor() {
    this.validator = new TagValidator()
  }

  @Transactional('batchCreateTags')
  batchCreateTags(tags, context, tx) {
    return this.validator.validate(tags, 'POST', tx)
      .then(() => db.tag.batchCreate(tags, context, tx)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @Transactional('getTagsByExperimentId')
  getTagsByExperimentId = (id, tx) => db.tag.findByExperimentId(id, tx)

  @Transactional('getTagsByExperimentIds')
  getTagsByExperimentIds = (ids, tx) => db.tag.batchFindByExperimentIds(ids, tx)

  @Transactional('getTagById')
  getTagById = (id, tx) => db.tag.find(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Tag Not Found for requested id = ${id}`)
        throw AppError.notFound('Tag Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchGetTagByIds')
  batchGetTagByIds = (ids, tx) => db.tag.batchFind(ids, tx)

  @Transactional('batchUpdateTags')
  batchUpdateTags(tags, context, tx) {
    return this.validator.validate(tags, 'PUT', tx)
      .then(() => db.tag.batchUpdate(tags, context, tx)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @Transactional('deleteTag')
  deleteTag = (id, tx) => db.tag.remove(id, tx)
    .then((data) => {
      if (!data) {
        logger.error(`Tag Not Found for requested id = ${id}`)
        throw AppError.notFound('Tag Not Found for requested id')
      } else {
        return data
      }
    })

  @Transactional('batchDeleteTags')
  batchDeleteTags = (ids, tx) => db.tag.batchRemove(ids, tx)

  @Transactional('deleteTagsForExperimentId')
  deleteTagsForExperimentId = (id, tx) => db.tag.removeByExperimentId(id, tx)
}

module.exports = TagService

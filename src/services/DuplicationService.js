import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import Transactional from '../decorators/transactional'
import TagService from './TagService'

class DuplicationService {
  constructor() {
    this.tagService = new TagService()
  }

  @Transactional('DuplicateExperiments')
  duplicateExperiments(body, context, tx) {
    const parsedCopyNum = Number(body ? body.numberOfCopies : undefined)
    if (body && body.ids && body.ids.length > 0 && parsedCopyNum > 0 && parsedCopyNum % 1 === 0) {
      const getTagsPromise = this.getAllTagsToDuplicate(body.ids)
      const sqlPromise = this.duplicateExperimentData(body.ids, body.numberOfCopies,
        body.isTemplate, context, tx)

      return Promise.all([getTagsPromise, sqlPromise])
        .then(results => this.duplicateTagsForExperiments(results[0], results[1], context))
    }
    throw AppError.badRequest('Body must contain at least one experiment id to duplicate and the number of copies to make.')
  }

  getAllTagsToDuplicate = (ids) => {
    const tagsToDuplicate = {}
    return Promise.all(_.map(ids, id => this.tagService.getTagsByExperimentId(id)
      .then((tags) => { tagsToDuplicate[id] = tags })))
      .then(() => tagsToDuplicate)
  }

  @Transactional('DuplicateExperiments')
  duplicateExperimentData = (ids, numberOfCopies, isTemplate = false, context, tx) => {
    let sqlPromise = Promise.resolve()
    const conversionMap = []
    _.forEach(ids, (id) => {
      for (let i = 0; i < numberOfCopies; i += 1) {
        sqlPromise = sqlPromise.then(() =>
          db.duplication.duplicateExperiment(id, isTemplate, context, tx))
          .then((newIdObject) => { conversionMap.push({ oldId: id, newId: newIdObject.id }) })
      }
    })

    return sqlPromise.then(() => conversionMap)
  }

  duplicateTagsForExperiments = (tagsToDuplicate, idConversionMap, context) => {
    const newTags = _.flatMap(idConversionMap, cm =>
      _.map(tagsToDuplicate[cm.oldId],
        tag => ({ experimentId: cm.newId, category: tag.category, value: tag.value })))

    const tagsPromise = newTags.length > 0
      ? this.tagService.batchCreateTags(newTags, context)
      : Promise.resolve()
    const newIds = _.map(idConversionMap, ids => ({ id: ids.newId }))
    return tagsPromise.then(() => AppUtil.createPostResponse(newIds))
  }
}

module.exports = DuplicationService

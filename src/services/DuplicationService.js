import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import Transactional from '../decorators/transactional'
import TagService from './TagService'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

// Error Codes 16XXXX
class DuplicationService {
  constructor() {
    this.tagService = new TagService()
  }

  @setErrorCode('161000')
  @Transactional('DuplicateExperiments')
  duplicateExperiments(body, context, source, tx) {
    const parsedCopyNum = Number(body ? body.numberOfCopies : undefined)
    if (body && body.ids && body.ids.length > 0 && parsedCopyNum > 0 && parsedCopyNum % 1 === 0) {
      const isTemplate = body.isTemplate || false
      const updateFlag = source === 'conversion' ? !isTemplate : isTemplate
      const getTagsPromise = this.getAllTagsToDuplicate(body.ids, updateFlag, context)
      const sqlPromise = this.duplicateExperimentData(body.ids, body.numberOfCopies,
        isTemplate, context, tx)

      return Promise.all([getTagsPromise, sqlPromise])
        .then(results => this.duplicateTagsForExperiments(results[0], results[1],
          context, isTemplate))
    }
    throw AppError.badRequest('Body must contain at least one experiment id to duplicate and the number of copies to make.', undefined, getFullErrorCode('161001'))
  }

  @setErrorCode('162000')
  getAllTagsToDuplicate = (ids, isTemplate, context) => {
    const tagsToDuplicate = {}
    return Promise.all(_.map(ids, id => this.tagService.getTagsByExperimentId(id, isTemplate,
      context)
      .then((tags) => { tagsToDuplicate[id] = tags })))
      .then(() => tagsToDuplicate)
  }

  @setErrorCode('163000')
  @Transactional('DuplicateExperiments')
  duplicateExperimentData = (ids, numberOfCopies, isTemplate, context, tx) => {
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

  @setErrorCode('164000')
  duplicateTagsForExperiments = (tagsToDuplicate, idConversionMap, context, isTemplate) => {
    const newTags = _.flatMap(idConversionMap, cm =>
      _.map(tagsToDuplicate[cm.oldId],
        tag => ({ experimentId: cm.newId, category: tag.category, value: tag.value })))

    const tagsPromise = newTags.length > 0
      ? this.tagService.batchCreateTags(newTags, context, isTemplate)
      : Promise.resolve()
    const newIds = _.map(idConversionMap, ids => ({ id: ids.newId }))
    return tagsPromise.then(() => AppUtil.createPostResponse(newIds))
  }
}

module.exports = DuplicationService

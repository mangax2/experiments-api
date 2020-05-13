import log4js from 'log4js'
import _ from 'lodash'
import TagValidator from '../validations/TagValidator'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

const logger = log4js.getLogger('TagService')

// Error Codes 1PXXXX
class TagService {
  constructor() {
    this.validator = new TagValidator()
  }

  @setErrorCode('1P1000')
  batchCreateTags(tags, context, isTemplate) {
    return this.validator.validate(tags)
      .then(() => PingUtil.getMonsantoHeader().then((header) => {
        const headers = header.slice()
        const experimentIds = _.uniq(_.map(tags, 'experimentId'))
        const tagsRequest = this.createTagRequest(tags, experimentIds, isTemplate)
        return HttpUtil.post(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags`, headers, tagsRequest).then(() => Promise.resolve()).catch((err) => {
          logger.error(`[[${context.requestId}]] An error occurred while creating the tags.`, err)
          err.errorCode = getFullErrorCode('1P1001')
          return Promise.reject(err)
        })
      }))
  }

  @setErrorCode('1P2000')
  createTagRequest = (tags, experimentIds, isTemplate) => {
    const entityTagsMap = _.groupBy(tags, 'experimentId')
    return _.map(experimentIds, (id) => {
      const entityTags = _.map(entityTagsMap[id], t => ({ category: t.category, value: t.value }))
      return { entityName: this.getEntityName(isTemplate), entityId: String(id), tags: entityTags }
    })
  }

  @setErrorCode('1P3000')
  saveTags(tags, experimentId, context, isTemplate) {
    return this.validator.validate(tags)
      .then(() => PingUtil.getMonsantoHeader().then((header) => {
        const headers = header.slice()
        const tagsRequest = _.map(tags, t => ({ category: t.category, value: t.value }))
        return HttpUtil.put(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}/${experimentId}`, headers, tagsRequest).then(() => Promise.resolve()).catch((err) => {
          logger.error(`[[${context.requestId}]] An error occurred while saving the tags.`, err)
          err.errorCode = getFullErrorCode('1P3001')
          return Promise.reject(err)
        })
      }))
  }

  @setErrorCode('1P4000')
  getTagsByExperimentId = (id, isTemplate, context) =>
    PingUtil.getMonsantoHeader()
      .then(header =>
        HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}/${id}`, header)
          .then(result => result.body.tags)
          .catch((err) => {
            if (err.status === 404) {
              return Promise.resolve([])
            }
            logger.error(`[[${context.requestId}]] An error occurred while getting the tags for ${this.getEntityName(isTemplate)} id: ${id}`, err)
            err.errorCode = getFullErrorCode('1P4001')
            return Promise.reject(err)
          }),
      )

  @setErrorCode('1P5000')
  copyTags = (sourceExperimentId, targetExperimentId, context, isTemplate) =>
    this.getTagsByExperimentId(sourceExperimentId, isTemplate, context).then((data) => {
      const tags = _.map(data, t => ({
        category: t.category,
        value: t.value,
        experimentId: targetExperimentId,
      }))
      if (tags.length > 0) {
        return this.batchCreateTags(tags, context, isTemplate)
      }
      return Promise.resolve()
    })

  @setErrorCode('1P6000')
  getEntityTagsByTagFilters = (tagCategories, tagValues, isTemplate, context) => PingUtil.getMonsantoHeader().then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}?tags.category=${tagCategories}&tags.value=${tagValues}`, header).then(result => result.body).catch((err) => {
    logger.error(`[[${context.requestId}]] An error occured while gettings tags by filters.`, err)
    err.errorCode = getFullErrorCode('1P6001')
    return Promise.reject(err)
  }),
  )

  @setErrorCode('1P7000')
  getAllTagsForEntity = entityName => PingUtil.getMonsantoHeader().then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/${entityName}`, header).then(result => result.body).catch((err) => {
    if (err.status === 404) {
      return Promise.resolve([])
    }
    err.errorCode = getFullErrorCode('1P7001')
    return Promise.reject(err)
  }),
  )

  @setErrorCode('1P8000')
  getEntityName = (isTemplate) => {
    if (isTemplate) {
      return 'template'
    }
    return 'experiment'
  }

  @setErrorCode('1P9000')
  deleteTagsForExperimentId = (id, context, isTemplate) =>
    PingUtil.getMonsantoHeader().then((header) => {
      const headers = header.slice()
      return HttpUtil.delete(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}/${id}`, headers).then(() => Promise.resolve()).catch((err) => {
        if (err.status === 404) {
          return Promise.resolve()
        }
        err.errorCode = getFullErrorCode('1P9001')
        return Promise.reject(err)
      })
    },
    )
}

module.exports = TagService

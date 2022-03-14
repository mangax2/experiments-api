import _ from 'lodash'
import TagValidator from '../validations/TagValidator'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import configurator from '../configs/configurator'
import AppError from './utility/AppError'

const apiUrls = configurator.get('urls')
const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1PXXXX
class TagService {
  constructor() {
    this.validator = new TagValidator()
  }

  @setErrorCode('1P1000')
  batchCreateTags(tags, context, isTemplate) {
    return this.validator.validate(tags)
      .then(() => OAuthUtil.getAuthorizationHeaders().then((header) => {
        const headers = header.slice()
        const experimentIds = _.uniq(_.map(tags, 'experimentId'))
        const tagsRequest = this.createTagRequest(tags, experimentIds, isTemplate)
        return HttpUtil.post(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags`, headers, tagsRequest)
          .then(() => Promise.resolve())
          .catch((err) => {
            const errorMessage = `[[${context.requestId}]] An error occurred while creating the tags.`
            const data = _.get(err, 'response.body')
            console.error(errorMessage, data)
            return Promise.reject(AppError.internalServerErrorWithMessage(errorMessage, data, getFullErrorCode('1P1001')))
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
      .then(() => OAuthUtil.getAuthorizationHeaders().then((header) => {
        const headers = header.slice()
        const tagsRequest = _.map(tags, t => ({ category: t.category, value: t.value }))
        return HttpUtil.put(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}/${experimentId}`, headers, tagsRequest)
          .then(() => Promise.resolve())
          .catch((err) => {
            const errorMessage = `[[${context.requestId}]] An error occurred while saving the tags.`
            const data = _.get(err, 'response.body')
            console.error(errorMessage, data)
            return Promise.reject(AppError.internalServerErrorWithMessage(errorMessage, data, getFullErrorCode('1P3001')))
          })
      }))
  }

  @setErrorCode('1P4000')
  getTagsByExperimentId = (id, isTemplate, context) =>
    OAuthUtil.getAuthorizationHeaders()
      .then(header =>
        HttpUtil.get(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}/${id}`, header)
          .then(result => result.body.tags)
          .catch((err) => {
            if (err.status === 404) {
              return Promise.resolve([])
            }
            const errorMessage = `[[${context.requestId}]] An error occurred while getting the tags for ${this.getEntityName(isTemplate)} id: ${id}`
            const data = _.get(err, 'response.body')
            console.error(errorMessage, data)
            return Promise.reject(AppError.internalServerErrorWithMessage(errorMessage, data, getFullErrorCode('1P4001')))
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
  getEntityTagsByTagFilters = (tagCategories, tagValues, isTemplate, context) =>
    OAuthUtil.getAuthorizationHeaders()
      .then(header => HttpUtil.get(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}?tags.category=${tagCategories}&tags.value=${tagValues}`, header))
      .then(result => result.body)
      .catch((err) => {
        const errorMessage = `[[${context.requestId}]] An error occurred while getting tags by filters.`
        const data = _.get(err, 'response.body')
        console.error(errorMessage, data)
        return Promise.reject(AppError.internalServerErrorWithMessage(errorMessage, data, getFullErrorCode('1P6001')))
      })


  @setErrorCode('1P7000')
  getAllTagsForEntity = entityName => OAuthUtil.getAuthorizationHeaders()
    .then(header => HttpUtil.get(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/${entityName}`, header))
    .then(result => result.body)
    .catch((err) => {
      if (err.status === 404) {
        return Promise.resolve([])
      }
      const errorMessage = 'An error occurred while retrieving tags.'
      const data = _.get(err, 'response.body')
      console.error(errorMessage, data)
      return Promise.reject(AppError.internalServerErrorWithMessage(errorMessage, data, getFullErrorCode('1P7001')))
    })


  @setErrorCode('1P8000')
  getEntityName = (isTemplate) => {
    if (isTemplate) {
      return 'template'
    }
    return 'experiment'
  }

  @setErrorCode('1P9000')
  deleteTagsForExperimentId = (id, context, isTemplate) =>
    OAuthUtil.getAuthorizationHeaders()
      .then((header) => {
        const headers = header.slice()
        return HttpUtil.delete(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/${this.getEntityName(isTemplate)}/${id}`, headers)
      })
      .then(() => Promise.resolve())
      .catch((err) => {
        if (err.status === 404) {
          return Promise.resolve()
        }
        const errorMessage = `[[${context.requestId}]] An error occurred while deleting tags.`
        const data = _.get(err, 'response.body') || err
        console.error(errorMessage, data)
        return Promise.reject(AppError.internalServerErrorWithMessage(errorMessage, data, getFullErrorCode('1P9001')))
      })
}

module.exports = TagService

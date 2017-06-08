import log4js from 'log4js'
import _ from 'lodash'
import TagValidator from '../validations/TagValidator'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'

const logger = log4js.getLogger('TagService')

class TagService {

  constructor() {
    this.validator = new TagValidator()
  }

  batchCreateTags(tags, context) {
    return this.validator.validate(tags)
      .then(() => PingUtil.getMonsantoHeader().then((header) => {
        const headers = header.slice()
        headers.push({ headerName: 'oauth_resourceownerinfo', headerValue: `username=${context.userId}` })
        const experimentIds = _.uniq(_.map(tags, 'experimentId'))
        const tagsRequest = TagService.createTagRequest(tags, experimentIds)
        return HttpUtil.post(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags`, headers, tagsRequest).then(() => Promise.resolve()).catch((err) => {
          logger.error(err)
          return Promise.reject(err)
        })
      }))
  }

  static createTagRequest(tags, experimentIds) {
    const entityTagsMap = _.groupBy(tags, 'experimentId')
    return _.map(experimentIds, (id) => {
      const entityTags = _.map(entityTagsMap[id], t => ({ category: t.category, value: t.value }))
      return { entityName: 'experiment', entityId: String(id), tags: entityTags }
    })
  }

  saveTags(tags, experimentId, context) {
    return this.validator.validate(tags)
      .then(() => PingUtil.getMonsantoHeader().then((header) => {
        const headers = header.slice()
        headers.push({ headerName: 'oauth_resourceownerinfo', headerValue: `username=${context.userId}` })
        const tagsRequest = _.map(tags, t => ({ category: t.category, value: t.value }))
        return HttpUtil.put(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/${experimentId}`, headers, tagsRequest).then(() => Promise.resolve()).catch((err) => {
          logger.error(err)
          return Promise.reject(err)
        })
      }))
  }

  getTagsByExperimentId = id => PingUtil.getMonsantoHeader().then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/${id}`, header).then(result => result.body.tags).catch((err) => {
    if (err.status === 404) {
      return Promise.resolve([])
    }
    logger.error(err)
    return Promise.reject(err)
  }),
  )

  getEntityTagsByTagFilters = (tagCategories, tagValues) => PingUtil.getMonsantoHeader().then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment?tags.category=${tagCategories}&tags.value=${tagValues}`, header).then(result => result.body).catch((err) => {
    logger.error(err)
    return Promise.reject(err)
  }),
  )

  getAllTagsForEntity = entityName => PingUtil.getMonsantoHeader().then(header => HttpUtil.get(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/${entityName}`, header).then(result => result.body).catch((err) => {
    if (err.status === 404) {
      return Promise.resolve([])
    }
    return Promise.reject(err)
  }),
  )

  deleteTagsForExperimentId = id => PingUtil.getMonsantoHeader().then(header => HttpUtil.delete(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/${id}`, header).then(() => Promise.resolve()).catch((err) => {
    if (err.status === 404) {
      return Promise.resolve()
    }
    return Promise.reject(err)
  }),
  )
}

module.exports = TagService

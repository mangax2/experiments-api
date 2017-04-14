import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsValidator from '../validations/ExperimentsValidator'
import TagService from './TagService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

  constructor() {
    this.validator = new ExperimentsValidator()
    this.tagService = new TagService()
  }

  @Transactional('batchCreateExperiments')
  batchCreateExperiments(experiments, context, tx) {
    console.log(this.validator)
    return this.validator.validate(experiments, 'POST', tx).then(() => db.experiments.batchCreate(experiments, context, tx).then((data) => {
      const experimentIds = _.map(data, d => d.id)
      const tags = this.assignExperimentIdToTags(experimentIds, experiments)
      if (tags && tags.length > 0) {
        return this.tagService.batchCreateTags(tags, context, tx)
          .then(() => AppUtil.createPostResponse(data))
      }
      return AppUtil.createPostResponse(data)
    }))
  }

  getExperiments(queryString) {
    if (this.isFilterRequest(queryString) === true) {
      return this.getExperimentsByFilters(queryString)
    }
    return this.getAllExperiments()
  }

  @Transactional('getExperimentById')
  getExperimentById(id, tx) {
    return db.experiments.find(id, tx).then((data) => {
      if (!data) {
        logger.error(`Experiment Not Found for requested experimentId = ${id}`)
        throw AppError.notFound('Experiment Not Found for requested experimentId')
      } else {
        return this.tagService.getTagsByExperimentId(id, tx).then((dbTags) => {
          data.tags = dbTags
          return data
        })
      }
    })
  }

  @Transactional('updateExperiment')
  updateExperiment(id, experiment, context, tx) {
    return this.validator.validate([experiment], 'PUT', tx).then(() => db.experiments.update(id, experiment, context, tx).then((data) => {
      if (!data) {
        logger.error(`Experiment Not Found to Update for id = ${id}`)
        throw AppError.notFound('Experiment Not Found to Update')
      } else {
        return this.tagService.deleteTagsForExperimentId(id, tx).then(() => {
          const tags = this.assignExperimentIdToTags([id], [experiment])
          if (tags.length > 0) {
            return this.tagService.batchCreateTags(tags, context, tx).then(() => data)
          }
          return data
        })
      }
    }))
  }

  deleteExperiment = id => db.experiments.remove(id)
    .then((data) => {
      if (!data) {
        logger.error(`Experiment Not Found for requested experimentId = ${id}`)
        throw AppError.notFound('Experiment Not Found for requested experimentId')
      } else {
        return data
      }
    })

  getExperimentsByFilters(queryString) {
    return this.validator.validate([queryString], 'FILTER').then(() => {
      const lowerCaseTagNames = this.toLowerCaseArray(queryString['tags.name'])
      const lowerCaseTagValues = this.toLowerCaseArray(queryString['tags.value'])
      return db.experiments.findExperimentsByTags(lowerCaseTagNames, lowerCaseTagValues)
    })
  }

  getAllExperiments = () => db.experiments.all()

  assignExperimentIdToTags = (experimentIds, experiments) => _.compact(
    _.flatMap(experimentIds, (id, index) => {
      const tags = experiments[index].tags
      if (tags && tags.length > 0) {
        _.forEach(tags, (tag) => {
          tag.experimentId = id
          tag.name = tag.name ? tag.name.toLowerCase() : undefined
          tag.value = tag.value ? tag.value.toLowerCase() : undefined
        })
      }
      return experiments[index].tags
    }))

  isFilterRequest = (queryString) => {
    const allowedFilters = ['tags.name', 'tags.value']
    return !_.isEmpty(queryString)
      && _.intersection(Object.keys(queryString), allowedFilters).length > 0
  }

  toLowerCaseArray = queryStringValue => (
    queryStringValue ? _.map(queryStringValue.split(','), _.toLower) : []
  )
}

module.exports = ExperimentsService

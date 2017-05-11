import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsValidator from '../validations/ExperimentsValidator'
import OwnerService from './OwnerService'
import TagService from './TagService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

  constructor() {
    this.validator = new ExperimentsValidator()
    this.ownerService = new OwnerService()
    this.tagService = new TagService()
  }

  @Transactional('batchCreateExperiments')
  batchCreateExperiments(experiments, context, tx) {
    return this.validator.validate(experiments, 'POST', tx)
      .then(() => db.experiments.batchCreate(experiments, context, tx)
        .then((data) => {
          const experimentIds = _.map(data, d => d.id)

          const experimentsOwners = _.map(experiments, (exp, index) => {
            const owners = _.map(exp.owners, own => _.trim(own))
            return { experimentId: experimentIds[index], userIds: owners }
          })

          return this.ownerService.batchCreateOwners(experimentsOwners, context, tx).then(() => {
            const tags = this.assignExperimentIdToTags(experimentIds, experiments)
            if (tags && tags.length > 0) {
              return this.tagService.batchCreateTags(tags, context, tx)
                .then(() => {
                  AppUtil.createPostResponse(data)
                })
            }
            return AppUtil.createPostResponse(data)
          })
        }))
  }

  getExperiments(queryString) {
    if (this.isFilterRequest(queryString) === true) {
      return this.getExperimentsByFilters(queryString)
        .then(data => this.populateOwners(data)
          .then(() => this.populateTags(data)))
    }
    return this.getAllExperiments()
      .then(data => Promise.all([this.populateOwners(data), this.populateTags(data)]))
  }

  populateOwners(experiments) {
    if (experiments.length === 0) return Promise.resolve([])
    const experimentIds = _.map(experiments, 'id')
    return this.ownerService.getOwnersByExperimentIds((experimentIds)).then(result =>
      _.map(experiments.slice(), (experiment) => {
        const owners = _.find(result, o => o.experiment_id === experiment.id) || { user_ids: [] }
        experiment.owners = owners.user_ids
        return experiment
      }),
    )
  }

  populateTags(experiments) {
    if (experiments.length === 0) return Promise.resolve([])
    const experimentIds = _.map(experiments, 'id')
    return this.tagService.getTagsByExperimentIds(experimentIds).then((tags) => {
      const experimentsAndTagsMap = _.groupBy(tags, 'experiment_id')
      return _.map(experiments.slice(), (experiment) => {
        experiment.tags = experimentsAndTagsMap[experiment.id]
        return experiment
      })
    })
  }

  @Transactional('getExperimentById')
  getExperimentById(id, tx) {
    return db.experiments.find(id, tx).then((data) => {
      if (!data) {
        logger.error(`Experiment Not Found for requested experimentId = ${id}`)
        throw AppError.notFound('Experiment Not Found for requested experimentId')
      } else {
        return Promise.all(
          [
            this.ownerService.getOwnersByExperimentId(id, tx),
            this.tagService.getTagsByExperimentId(id, tx),
          ],
        ).then((ownersAndTags) => {
          data.owners = ownersAndTags[0].user_ids
          data.tags = ownersAndTags[1]
          return data
        })
      }
    })
  }

  @Transactional('updateExperiment')
  updateExperiment(id, experiment, context, tx) {
    return this.validator.validate([experiment], 'PUT', tx)
      .then(() => db.experiments.update(id, experiment, context, tx)
        .then((data) => {
          if (!data) {
            logger.error(`Experiment Not Found to Update for id = ${id}`)
            throw AppError.notFound('Experiment Not Found to Update')
          } else {
            const trimmedUserIds = _.map(experiment.owners, o => _.trim(o))
            const owners = { experimentId: id, userIds: trimmedUserIds }

            return this.ownerService.batchUpdateOwners([owners], context, tx)
              .then(() => this.tagService.deleteTagsForExperimentId(id, tx).then(() => {
                const tags = this.assignExperimentIdToTags([id], [experiment])
                if (tags.length > 0) {
                  return this.tagService.batchCreateTags(tags, context, tx)
                    .then(() => data)
                }
                return data
              }))
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

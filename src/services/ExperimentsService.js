import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsValidator from '../validations/ExperimentsValidator'
import CapacityRequestService from './CapacityRequestService'
import OwnerService from './OwnerService'
import SecurityService from './SecurityService'

import TagService from './TagService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {

  constructor() {
    this.validator = new ExperimentsValidator()
    this.ownerService = new OwnerService()
    this.tagService = new TagService()
    this.securityService = new SecurityService()
  }

  @Transactional('batchCreateExperiments')
  batchCreateExperiments(experiments, context, tx) {
    return this.validator.validate(experiments, 'POST', tx)
      .then(() => this.validateAssociatedRequests(experiments))
      .then(() => db.experiments.batchCreate(experiments, context, tx)
      .then((data) => {
        const experimentIds = _.map(data, d => d.id)
        _.forEach(experiments, (experiment, index) => {
          experiment.id = experimentIds[index]
        })

        const experimentsOwners = _.map(experiments, (exp) => {
          const owners = _.map(exp.owners, _.trim)
          const ownerGroups = _.map(exp.ownerGroups, _.trim)
          return { experimentId: exp.id, userIds: owners, groupIds: ownerGroups }
        })

        return this.ownerService.batchCreateOwners(experimentsOwners, context, tx).then(() => {
          const capacityRequestPromises =
            CapacityRequestService.batchAssociateExperimentsToCapacityRequests(experiments, context)
          return Promise.all(capacityRequestPromises)
            .then(() => this.batchCreateExperimentTags(experiments, context))
            .then(() => AppUtil.createPostResponse(data))
        })
      }))
  }

  batchCreateExperimentTags(experiments, context) {
    const tags = this.assignExperimentIdToTags(experiments)
    if (tags && tags.length > 0) {
      return this.tagService.batchCreateTags(tags, context)
    }
    return Promise.resolve()
  }

  validateAssociatedRequests = (experiments) => {
    const associatedRequests = _.map(_.filter(experiments, 'request'), exp => exp.request)
    const invalidAssociateRequests = _.filter(associatedRequests, req => !req.id || !req.type)
    if (invalidAssociateRequests.length > 0) {
      return Promise.reject(AppError.badRequest('Each request must have an id and a type.'))
    }
    return Promise.resolve()
  }

  getExperiments(queryString) {
    if (this.isFilterRequest(queryString) === true) {
      return this.getExperimentsByFilters(queryString)
        .then(data => this.populateOwners(data))
    }
    return this.getAllExperiments()
      .then(data => Promise.all(
        [this.populateOwners(data), this.populateTagsForAllExperiments(data)],
      )
        .then(() => data))
  }

  populateOwners(experiments) {
    if (experiments.length === 0) return Promise.resolve([])
    const experimentIds = _.map(experiments, 'id')
    return this.ownerService.getOwnersByExperimentIds((experimentIds)).then(result =>
      _.map(experiments.slice(), (experiment) => {
        const owners = _.find(result, o => o.experiment_id === experiment.id) || { user_ids: [] }
        experiment.owners = owners.user_ids
        experiment.ownerGroups = owners.group_ids
        return experiment
      }),
    )
  }

  populateTagsForAllExperiments(experiments) {
    if (experiments.length === 0) return Promise.resolve([])
    return this.tagService.getAllTagsForEntity('experiment')
      .then(entityTags => ExperimentsService.mergeTagsWithExperiments(experiments, entityTags))
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
            this.tagService.getTagsByExperimentId(id),
          ],
        ).then((ownersAndTags) => {
          data.owners = ownersAndTags[0].user_ids
          data.ownerGroups = ownersAndTags[0].group_ids
          data.tags = ExperimentsService.prepareTagResponse(ownersAndTags[1])
          return data
        })
      }
    })
  }

  @Transactional('updateExperiment')
  updateExperiment(experimentId, experiment, context, tx) {
    const id = Number(experimentId)
    return this.securityService.permissionsCheck(id, context, tx)
      .then(() => this.validator.validate([experiment], 'PUT', tx)
        .then(() => db.experiments.update(id, experiment, context, tx)
          .then((data) => {
            if (!data) {
              logger.error(`Experiment Not Found to Update for id = ${id}`)
              throw AppError.notFound('Experiment Not Found to Update')
            } else {
              const trimmedUserIds = _.map(experiment.owners, _.trim)
              const trimmedOwnerGroups = _.map(experiment.ownerGroups, _.trim)

              const owners = { experimentId: id,
                userIds: trimmedUserIds,
                groupIds: trimmedOwnerGroups }
              return this.ownerService.batchUpdateOwners([owners], context, tx)
                .then(() => {
                  experiment.id = id
                  const tags = this.assignExperimentIdToTags([experiment])
                  if (tags.length > 0) {
                    return this.tagService.saveTags(tags, id, context)
                        .then(() => data)
                  }
                  return this.tagService.deleteTagsForExperimentId(id, context).then(() => data)
                },
                )
            }
          })))
  }

  deleteExperiment = (id, context, tx) => this.securityService.permissionsCheck(id, context, tx)
    .then(() => db.experiments.remove(id)
      .then((data) => {
        if (!data) {
          logger.error(`Experiment Not Found for requested experimentId = ${id}`)
          throw AppError.notFound('Experiment Not Found for requested experimentId')
        } else {
          return this.tagService.deleteTagsForExperimentId(id).then(() => data)
        }
      }))


  getExperimentsByFilters(queryString) {
    return this.validator.validate([queryString], 'FILTER').then(() => {
      const lowerCaseTagCategories = _.toLower(queryString['tags.category'])
      const lowerCaseTagValues = _.toLower(queryString['tags.value'])
      return this.tagService.getEntityTagsByTagFilters(lowerCaseTagCategories, lowerCaseTagValues)
        .then((eTags) => {
          if (eTags.length === 0) {
            return []
          }
          const experimentIds = _.map(eTags, 'entityId')
          return db.experiments.batchFind(experimentIds)
            .then(experiments => ExperimentsService.mergeTagsWithExperiments(experiments, eTags))
        })
    })
  }

  getAllExperiments = () => db.experiments.all()

  assignExperimentIdToTags = experiments => _.compact(
    _.flatMap(experiments, (exp) => {
      const tags = exp.tags
      if (tags && tags.length > 0) {
        _.forEach(tags, (tag) => {
          tag.experimentId = exp.id
          tag.category = tag.category ? tag.category.toLowerCase() : undefined
          tag.value = tag.value ? tag.value.toLowerCase() : undefined
        })
      }
      return exp.tags
    }))

  isFilterRequest = (queryString) => {
    const allowedFilters = ['tags.category', 'tags.value']
    return !_.isEmpty(queryString)
      && _.intersection(Object.keys(queryString), allowedFilters).length > 0
  }


  static mergeTagsWithExperiments(experiments, entityTags) {
    const experimentsAndTagsMap = _.groupBy(entityTags, 'entityId')
    return _.map(experiments.slice(), (experiment) => {
      const tags = experimentsAndTagsMap[experiment.id] ?
        experimentsAndTagsMap[experiment.id][0].tags : []
      experiment.tags = ExperimentsService.prepareTagResponse(tags)
      return experiment
    })
  }

  static prepareTagResponse(tags) {
    return _.map(tags, t => ({ category: t.category, value: t.value }))
  }

}

module.exports = ExperimentsService

import log4js from 'log4js'
import _ from 'lodash'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsValidator from '../validations/ExperimentsValidator'
import CapacityRequestService from './CapacityRequestService'
import OwnerService from './OwnerService'
import SecurityService from './SecurityService'
import DuplicationService from './DuplicationService'
import TagService from './TagService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentsService')

class ExperimentsService {
  constructor() {
    this.validator = new ExperimentsValidator()
    this.ownerService = new OwnerService()
    this.tagService = new TagService()
    this.securityService = new SecurityService()
    this.duplicationService = new DuplicationService()
  }

  @Transactional('batchCreateExperiments')
  batchCreateExperiments(experiments, context, isTemplate, tx) {
    return this.validator.validate(experiments, 'POST', tx)
      .then(() => this.validateAssociatedRequests(experiments, isTemplate))
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
            const capacityRequestPromises = !isTemplate ?
              CapacityRequestService.batchAssociateExperimentsToCapacityRequests(experiments,
                context) : []
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

  validateAssociatedRequests = (experiments, isTemplate) => {
    const associatedRequests = _.map(_.filter(experiments, 'request'), exp => exp.request)
    if (!isTemplate) {
      const invalidAssociateRequests = _.filter(associatedRequests, req => !req.id || !req.type)
      if (invalidAssociateRequests.length > 0) {
        return Promise.reject(AppError.badRequest('Each request must have an id and a type.'))
      }
      return Promise.resolve()
    }
    if (associatedRequests.length > 0) {
      return Promise.reject(AppError.badRequest('Template(s) cannot be associated to a request'))
    }
    return Promise.resolve()
  }

  getExperiments(queryString, isTemplate) {
    if (this.isFilterRequest(queryString) === true) {
      return this.getExperimentsByFilters(queryString, isTemplate)
        .then(data => this.populateOwners(data))
    }
    return this.getAllExperiments(isTemplate)
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
  getExperimentById(id, isTemplate, tx) {
    return db.experiments.find(id, isTemplate, tx).then((data) => {
      if (!data) {
        const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
          : 'Experiment Not Found for requested experimentId'
        logger.error(`${errorMessage} = ${id}`)
        throw AppError.notFound(errorMessage)
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
  updateExperiment(experimentId, experiment, context, isTemplate, tx) {
    const id = Number(experimentId)
    experiment.isTemplate = isTemplate
    return this.securityService.permissionsCheck(id, context, isTemplate, tx)
      .then(() => this.validator.validate([experiment], 'PUT', tx)
        .then(() => db.experiments.update(id, experiment, context, tx)
          .then((data) => {
            if (!data) {
              const errorMessage = isTemplate ? 'Template Not Found to Update for id'
                : 'Experiment Not Found to Update for id'
              logger.error(`${errorMessage} = ${id}`)
              throw AppError.notFound(errorMessage)
            } else {
              const trimmedUserIds = _.map(experiment.owners, _.trim)
              const trimmedOwnerGroups = _.map(experiment.ownerGroups, _.trim)

              const owners = {
                experimentId: id,
                userIds: trimmedUserIds,
                groupIds: trimmedOwnerGroups,
              }
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

  deleteExperiment =
    (id, context, isTemplate, tx) => this.securityService.permissionsCheck(id, context,
      isTemplate, tx)
      .then(() => db.experiments.remove(id, isTemplate)
        .then((data) => {
          if (!data) {
            logger.error(`Experiment Not Found for requested experimentId = ${id}`)
            throw AppError.notFound('Experiment Not Found for requested experimentId')
          } else {
            return this.tagService.deleteTagsForExperimentId(id).then(() => data)
          }
        }))

  getExperimentsByFilters(queryString, isTemplate) {
    return this.validator.validate([queryString], 'FILTER').then(() => {
      const lowerCaseTagCategories = _.toLower(queryString['tags.category'])
      const lowerCaseTagValues = _.toLower(queryString['tags.value'])
      return this.tagService.getEntityTagsByTagFilters(lowerCaseTagCategories, lowerCaseTagValues)
        .then((eTags) => {
          if (eTags.length === 0) {
            return []
          }
          const experimentIds = _.map(eTags, 'entityId')
          return db.experiments.batchFindExperimentOrTemplate(experimentIds, isTemplate)
            .then(experiments => ExperimentsService.mergeTagsWithExperiments(experiments, eTags))
        })
    })
  }

  getAllExperiments = isTemplate => db.experiments.all(isTemplate)

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

  @Transactional('manageExperiments')
  manageExperiments(requestBody, queryString, context, tx) {
    const source = queryString.source
    let experimentPromise
    switch (source) {
      case undefined :
        experimentPromise = this.batchCreateExperiments(requestBody, context, false, tx)
        break
      case 'template' : {
        const numberOfCopies = requestBody.numberOfCopies || 1
        experimentPromise = this.createEntity(requestBody.id, numberOfCopies,
          context, false, tx).then((data) => {
            if (data && _.isArray(data)) {
              const tags = []
              const tagsPromise = []
              _.forEach(_.range(numberOfCopies), (t) => {
                const experimentId = data[t].id
                tags.push({
                  category: 'FROM TEMPLATE',
                  value: String(requestBody.id),
                  experimentId,
                })
                tagsPromise.push(this.tagService.saveTags(tags, experimentId, context))
              })
              return Promise.all(tagsPromise).then(() =>
              AppUtil.createPostResponse(data),
            )
            }
            return Promise.reject('Create Experiment From Template Failed')
          })
        break
      }
      case 'experiment' : {
        experimentPromise = this.copyEntities(requestBody.ids,
          requestBody.numberOfCopies,
          context, false, tx)
        break
      }
      default :
        experimentPromise = Promise.reject(AppError.badRequest('Invalid Source Type'))
        break
    }
    return experimentPromise
  }

  @Transactional('manageTemplates')
  manageTemplates(requestBody, queryString, context, tx) {
    const source = queryString.source
    let templatePromise
    switch (source) {
      case undefined :
        templatePromise = this.batchCreateTemplates(requestBody, context, tx)
        break
      case 'template' : {
        templatePromise = this.copyEntities(requestBody.ids, requestBody.numberOfCopies,
          context, true, tx)
        break
      }
      case 'experiment' : {
        const numberOfCopies = requestBody.numberOfCopies || 1
        templatePromise = this.createEntity(requestBody.id,
          numberOfCopies,
          context, true, tx)
        break
      }
      default :
        templatePromise = Promise.reject(AppError.badRequest('Invalid Source Type'))
        break
    }
    return templatePromise
  }

  createEntity(id, numberOfCopies, context, isTemplate, tx) {
    if (_.isNumber(id) && _.isNumber(numberOfCopies)) {
      return this.generateEntities([id], numberOfCopies,
        context, isTemplate, tx)
    }
    const entityCreatedFrom = isTemplate ? 'Experiment' : 'Template'
    return Promise.reject(AppError.badRequest(`Invalid ${entityCreatedFrom} Id or number of Copies`))
  }

  copyEntities(ids, numberOfCopies, context, isTemplate, tx) {
    if (!_.isArray(ids)) {
      return Promise.reject(AppError.badRequest('ids must be an array'))
    }

    const idsCheck = _.partition(ids, id => _.isNumber(id))
    if (_.isNumber(numberOfCopies) && ids.length > 0 && idsCheck[1].length === 0) {
      return this.generateEntities(ids, numberOfCopies,
        context, isTemplate, tx)
    }
    return Promise.reject(AppError.badRequest('Invalid ids or number' +
      ' of Copies'))
  }

  batchCreateTemplates(templates, context, tx) {
    const templatesArrayObj = _.map(templates, (t) => {
      t.isTemplate = true
      return t
    })
    return this.batchCreateExperiments(templatesArrayObj, context, true, tx)
  }

  generateEntities(ids, numberOfCopies, context, isTemplate, tx) {
    const duplicationObj = { ids, numberOfCopies, isTemplate }
    return this.duplicationService.duplicateExperiments(duplicationObj, context, tx)
  }

  static
  mergeTagsWithExperiments(experiments, entityTags) {
    const experimentsAndTagsMap = _.groupBy(entityTags, 'entityId')
    return _.map(experiments.slice(), (experiment) => {
      const tags = experimentsAndTagsMap[experiment.id] ?
        experimentsAndTagsMap[experiment.id][0].tags : []
      experiment.tags = ExperimentsService.prepareTagResponse(tags)
      return experiment
    })
  }

  static
  prepareTagResponse(tags) {
    return _.map(tags, t => ({ category: t.category, value: t.value }))
  }
}

module.exports = ExperimentsService

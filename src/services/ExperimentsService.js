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
import { notifyChanges } from '../decorators/notifyChanges'
import Transactional from '../decorators/transactional'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('ExperimentsService')

// Error Codes 15XXXX
class ExperimentsService {
  constructor() {
    this.validator = new ExperimentsValidator()
    this.ownerService = new OwnerService()
    this.tagService = new TagService()
    this.securityService = new SecurityService()
    this.duplicationService = new DuplicationService()
  }

  @setErrorCode('151000')
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
            const reviewers = _.map(exp.reviewers, _.trim)
            return {
              experimentId: exp.id, userIds: owners, groupIds: ownerGroups, reviewerIds: reviewers,
            }
          })

          return this.ownerService.batchCreateOwners(experimentsOwners, context, tx).then(() => {
            const capacityRequestPromises = !isTemplate ?
              CapacityRequestService.batchAssociateExperimentsToCapacityRequests(experiments,
                context) : []
            return Promise.all(capacityRequestPromises)
              .then(() => this.batchCreateExperimentTags(experiments, context, isTemplate))
              .then(() => AppUtil.createPostResponse(data))
          })
        }))
  }

  @setErrorCode('152000')
  batchCreateExperimentTags(experiments, context, isTemplate) {
    const tags = this.assignExperimentIdToTags(experiments)
    if (tags && tags.length > 0) {
      return this.tagService.batchCreateTags(tags, context, isTemplate)
    }
    return Promise.resolve()
  }

  @setErrorCode('153000')
  validateAssociatedRequests = (experiments, isTemplate) => {
    const associatedRequests = _.map(_.filter(experiments, 'request'), exp => exp.request)
    if (!isTemplate) {
      const invalidAssociateRequests = _.filter(associatedRequests, req => !req.id || !req.type)
      if (invalidAssociateRequests.length > 0) {
        return Promise.reject(AppError.badRequest('Each request must have an id and a type.', undefined, getFullErrorCode('153001')))
      }
      return Promise.resolve()
    }
    if (associatedRequests.length > 0) {
      return Promise.reject(AppError.badRequest('Template(s) cannot be associated to a request', undefined, getFullErrorCode('153002')))
    }
    return Promise.resolve()
  }

  @setErrorCode('154000')
  getExperiments(queryString, isTemplate, context) {
    if (this.isFilterRequest(queryString) === true) {
      return this.getExperimentsByFilters(queryString, isTemplate, context)
        .then(data => this.populateOwners(data))
    }
    return this.getAllExperiments(isTemplate)
      .then(data => Promise.all(
        [this.populateOwners(data), this.populateTagsForAllExperiments(data, isTemplate)],
      )
        .then(() => data))
  }

  @setErrorCode('155000')
  populateOwners(experiments) {
    if (experiments.length === 0) return Promise.resolve([])
    const experimentIds = _.map(experiments, 'id')
    return this.ownerService.getOwnersByExperimentIds((experimentIds)).then(result =>
      _.map(experiments.slice(), (experiment) => {
        const owners = _.find(result, o => o.experiment_id === experiment.id) || { user_ids: [] }
        experiment.owners = owners.user_ids
        experiment.ownerGroups = owners.group_ids
        experiment.reviewers = owners.reviewer_ids
        return experiment
      }),
    )
  }

  @setErrorCode('156000')
  populateTagsForAllExperiments(experiments, isTemplate) {
    if (experiments.length === 0) return Promise.resolve([])
    const entity = isTemplate ? 'template' : 'experiment'
    return this.tagService.getAllTagsForEntity(entity)
      .then(entityTags => ExperimentsService.mergeTagsWithExperiments(experiments, entityTags))
  }

  @setErrorCode('157000')
  @Transactional('verifyExperimentExists')
  static verifyExperimentExists(id, isTemplate, context, tx) {
    return db.experiments.find(id, isTemplate, tx).then((data) => {
      if (!data) {
        const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
          : 'Experiment Not Found for requested experimentId'
        logger.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
        throw AppError.notFound(errorMessage, undefined, getFullErrorCode('157001'))
      }
    })
  }

  @setErrorCode('158000')
  @Transactional('getExperimentById')
  getExperimentById(id, isTemplate, context, tx) {
    return db.experiments.find(id, isTemplate, tx).then((data) => {
      if (!data) {
        const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
          : 'Experiment Not Found for requested experimentId'
        logger.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
        throw AppError.notFound(errorMessage, undefined, getFullErrorCode('158001'))
      } else {
        return Promise.all(
          [
            this.ownerService.getOwnersByExperimentId(id, tx),
            this.tagService.getTagsByExperimentId(id, isTemplate, context),
          ],
        ).then((ownersAndTags) => {
          data.owners = ownersAndTags[0].user_ids
          data.ownerGroups = ownersAndTags[0].group_ids
          data.reviewers = ownersAndTags[0].reviewer_ids
          data.tags = ExperimentsService.prepareTagResponse(ownersAndTags[1])
          return data
        })
      }
    })
  }

  @notifyChanges('update', 0, 3)
  @setErrorCode('159000')
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
              logger.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
              throw AppError.notFound(errorMessage, undefined, getFullErrorCode('159001'))
            } else {
              const trimmedUserIds = _.map(experiment.owners, _.trim)
              const trimmedOwnerGroups = _.map(experiment.ownerGroups, _.trim)
              const trimmedReviewers = _.map(experiment.reviewers, _.trim)
              const owners = {
                experimentId: id,
                userIds: trimmedUserIds,
                groupIds: trimmedOwnerGroups,
                reviewerIds: trimmedReviewers,
              }
              return this.ownerService.batchUpdateOwners([owners], context, tx)
                .then(() => {
                  experiment.id = id
                  const tags = this.assignExperimentIdToTags([experiment])
                  if (tags.length > 0) {
                    return this.tagService.saveTags(tags, id, context, isTemplate)
                      .then(() => data)
                  }
                  return this.tagService.deleteTagsForExperimentId(id, context, isTemplate)
                    .then(() => data)
                },
                )
            }
          })))
  }

  @setErrorCode('15A000')
  deleteExperiment =
    (id, context, isTemplate, tx) => this.securityService.permissionsCheck(id, context,
      isTemplate, tx)
      .then(() => db.experiments.remove(id, isTemplate)
        .then((data) => {
          if (!data) {
            logger.error(`[[${context.requestId}]] Experiment Not Found for requested experimentId = ${id}`)
            throw AppError.notFound('Experiment Not Found for requested experimentId', undefined, getFullErrorCode('15A001'))
          } else {
            return this.tagService.deleteTagsForExperimentId(id).then(() => data)
          }
        }))

  @setErrorCode('15B000')
  getExperimentsByFilters(queryString, isTemplate, context) {
    return this.validator.validate([queryString], 'FILTER').then(() => {
      const lowerCaseTagCategories = _.toLower(queryString['tags.category'])
      const lowerCaseTagValues = _.toLower(queryString['tags.value'])
      return this.tagService.getEntityTagsByTagFilters(lowerCaseTagCategories,
        lowerCaseTagValues, isTemplate, context)
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

  @setErrorCode('15C000')
  getAllExperiments = isTemplate => db.experiments.all(isTemplate)

  @setErrorCode('15D000')
  assignExperimentIdToTags = experiments => _.compact(
    _.flatMap(experiments, (exp) => {
      const { tags } = exp
      if (tags && tags.length > 0) {
        _.forEach(tags, (tag) => {
          tag.experimentId = exp.id
          tag.category = tag.category ? tag.category.toLowerCase() : undefined
          tag.value = tag.value ? tag.value.toLowerCase() : undefined
        })
      }
      return exp.tags
    }))

  @setErrorCode('15E000')
  isFilterRequest = (queryString) => {
    const allowedFilters = ['tags.category', 'tags.value']
    return !_.isEmpty(queryString)
      && _.intersection(Object.keys(queryString), allowedFilters).length > 0
  }

  @notifyChanges('create', null, 1)
  @setErrorCode('15F000')
  @Transactional('manageExperiments')
  manageExperiments(requestBody, queryString, context, tx) {
    const { source } = queryString
    let experimentPromise
    switch (source) {
      case undefined:
        experimentPromise = this.batchCreateExperiments(requestBody, context, false, tx)
        break
      case 'template': {
        const numberOfCopies = requestBody.numberOfCopies || 1
        experimentPromise = this.createEntity(requestBody.id, numberOfCopies,
          context, false, tx).then((data) => {
          if (data && _.isArray(data)) {
            const tagsPromise = []
            _.forEach(_.range(numberOfCopies), (t) => {
              const experimentId = data[t].id
              const newTag = {
                category: 'FROM TEMPLATE',
                value: String(requestBody.id),
                experimentId,
              }
              tagsPromise.push(this.getExperimentById(experimentId, false, context, tx)
                .then((result) => {
                  const tags = _.map(result.tags, (tag) => {
                    tag.experimentId = experimentId
                    return tag
                  })
                  tags.push(newTag)
                  return this.tagService.saveTags(tags, experimentId, context, false)
                }))
            })
            return Promise.all(tagsPromise).then(() =>
              AppUtil.createPostResponse(data),
            )
          }
          return Promise.reject(AppError.internalServerError('Create Experiment From Template Failed', undefined, getFullErrorCode('15F001')))
        })
        break
      }
      case 'experiment': {
        experimentPromise = this.copyEntities(requestBody.ids,
          requestBody.numberOfCopies,
          context, false, tx)
        break
      }
      default:
        experimentPromise = Promise.reject(AppError.badRequest('Invalid Source Type', undefined, getFullErrorCode('15F002')))
        break
    }
    return experimentPromise
  }

  @setErrorCode('15G000')
  @Transactional('manageTemplates')
  manageTemplates(requestBody, queryString, context, tx) {
    const { source } = queryString
    let templatePromise
    switch (source) {
      case undefined:
        templatePromise = this.batchCreateTemplates(requestBody, context, tx)
        break
      case 'template': {
        templatePromise = this.copyEntities(requestBody.ids, requestBody.numberOfCopies,
          context, true, tx)
        break
      }
      case 'experiment': {
        const numberOfCopies = requestBody.numberOfCopies || 1
        templatePromise = this.createEntity(requestBody.id,
          numberOfCopies,
          context, true, tx)
        break
      }
      default:
        templatePromise = Promise.reject(AppError.badRequest('Invalid Source Type', undefined, getFullErrorCode('15G001')))
        break
    }
    return templatePromise
  }

  @setErrorCode('15H000')
  createEntity(id, numberOfCopies, context, isTemplate, tx) {
    if (_.isNumber(id) && _.isNumber(numberOfCopies)) {
      return this.generateEntities([id], numberOfCopies,
        context, isTemplate, 'conversion', tx)
    }
    const entityCreatedFrom = isTemplate ? 'Experiment' : 'Template'
    return Promise.reject(AppError.badRequest(`Invalid ${entityCreatedFrom} Id or number of Copies`, undefined, getFullErrorCode('15H001')))
  }

  @setErrorCode('15I000')
  copyEntities(ids, numberOfCopies, context, isTemplate, tx) {
    if (!_.isArray(ids)) {
      return Promise.reject(AppError.badRequest('ids must be an array', undefined, getFullErrorCode('15I001')))
    }

    const idsCheck = _.partition(ids, id => _.isNumber(id))
    if (_.isNumber(numberOfCopies) && ids.length > 0 && idsCheck[1].length === 0) {
      return this.generateEntities(ids, numberOfCopies,
        context, isTemplate, 'copy', tx)
    }
    return Promise.reject(AppError.badRequest('Invalid ids or number of Copies', undefined, getFullErrorCode('15I002')))
  }

  @setErrorCode('15J000')
  batchCreateTemplates(templates, context, tx) {
    const templatesArrayObj = _.map(templates, (t) => {
      t.isTemplate = true
      return t
    })
    return this.batchCreateExperiments(templatesArrayObj, context, true, tx)
  }

  @setErrorCode('15K000')
  generateEntities(ids, numberOfCopies, context, isTemplate, source, tx) {
    const duplicationObj = { ids, numberOfCopies, isTemplate }
    return this.duplicationService.duplicateExperiments(duplicationObj, context, source, tx)
  }

  @setErrorCode('15L000')
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

  @setErrorCode('15M000')
  static
  prepareTagResponse(tags) {
    return _.map(tags, t => ({ category: t.category, value: t.value }))
  }

  @setErrorCode('15N000')
  @Transactional('getExperimentsByUser')
  getExperimentsByUser = (userId, isTemplate, tx) => {
    if (!userId || !userId.slice) {
      return Promise.reject(AppError.badRequest('No UserId provided.', undefined, getFullErrorCode('15N001')))
    }
    if (userId.length !== 1) {
      return Promise.reject(AppError.badRequest('Multiple UserIds are not allowed.', undefined, getFullErrorCode('15N002')))
    }
    return this.securityService.getGroupsByUserId(userId[0]).then(groupIds =>
      db.experiments.findExperimentsByUserIdOrGroup(isTemplate, userId[0], groupIds, tx))
  }

  @setErrorCode('15O000')
  getExperimentsByCriteria = ({ criteria, value, isTemplate }) => {
    switch (criteria) {
      case 'owner':
        return this.getExperimentsByUser(value, isTemplate)
      default:
        return Promise.reject(AppError.badRequest('Invalid criteria provided', undefined, getFullErrorCode('15O001')))
    }
  }
}

module.exports = ExperimentsService

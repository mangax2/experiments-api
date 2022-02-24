/* eslint-disable max-len */
import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import apiUrls from '../config/apiUrls'
import { dbRead, dbWrite } from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import ExperimentsValidator from '../validations/ExperimentsValidator'
import CapacityRequestService from './CapacityRequestService'
import OwnerService from './OwnerService'
import SecurityService from './SecurityService'
import DuplicationService from './DuplicationService'
import TagService from './TagService'
import FactorService from './FactorService'
import AnalysisModelService from './AnalysisModelService'
import { notifyChanges } from '../decorators/notifyChanges'
import LocationAssociationWithBlockService from './LocationAssociationWithBlockService'
import DesignSpecificationDetailService from './DesignSpecificationDetailService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 15XXXX
class ExperimentsService {
  constructor() {
    this.validator = new ExperimentsValidator()
    this.ownerService = new OwnerService()
    this.tagService = new TagService()
    this.securityService = new SecurityService()
    this.duplicationService = new DuplicationService()
    this.factorService = new FactorService()
    this.analysisModelService = new AnalysisModelService()
    this.locationAssocWithBlockService = new LocationAssociationWithBlockService()
    this.designSpecificationDetailService = new DesignSpecificationDetailService()
  }

  @setErrorCode('151000')
  @Transactional('batchCreateExperiments')
  batchCreateExperiments(experiments, context, isTemplate, tx) {
    return this.validator.validate(experiments, 'POST')
      .then(() => this.validateAssociatedRequests(experiments, isTemplate))
      .then(() => dbWrite.experiments.batchCreate(experiments, context, tx)
        .then((data) => {
          const experimentIds = _.map(data, d => d.id)
          _.forEach(experiments, (experiment, index) => {
            experiment.id = experimentIds[index]
          })

          const experimentsOwners = _.map(experiments, (exp) => {
            const owners = (exp.owners || []).map(owner => owner.trim())
            const ownerGroups = (exp.ownerGroups || []).map(ownerGroup => ownerGroup.trim())
            const reviewerGroups = (exp.reviewers || []).map(reviewerGroup => reviewerGroup.trim())
            const reviewers = (exp.reviewerUsers || []).map(reviewer => reviewer.trim())
            return {
              experimentId: exp.id, userIds: owners, groupIds: ownerGroups, reviewerGroupIds: reviewerGroups, reviewerIds: reviewers,
            }
          })
          const promises = []
          promises.push(this.ownerService.batchCreateOwners(experimentsOwners, context, tx))
          const analysisModelInfo = _.compact(_.map(experiments, (exp) => {
            if (exp.analysisModelType) {
              return {
                experimentId: exp.id,
                analysisModelType: exp.analysisModelType,
                analysisModelSubType: exp.analysisModelSubType,
              }
            }
            return null
          }))
          promises.push(this.analysisModelService.batchCreateAnalysisModel(analysisModelInfo, context, tx))
          return tx.batch(promises).then(() => {
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
        experiment.reviewerUsers = owners.reviewer_user_ids
        experiment.reviewers = owners.reviewer_group_ids
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
  static verifyExperimentExists(id, isTemplate, context) {
    return dbRead.experiments.find(id, isTemplate).then((data) => {
      if (!data) {
        const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
          : 'Experiment Not Found for requested experimentId'
        console.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
        throw AppError.notFound(errorMessage, undefined, getFullErrorCode('157001'))
      }
    })
  }

  @setErrorCode('15U000')
  findExperimentWithTemplateCheck = (id, isTemplate, context) =>
    dbRead.experiments.find(id, isTemplate).then((data) => {
      if (!data) {
        const errorMessage = isTemplate ? 'Template Not Found for requested templateId'
          : 'Experiment Not Found for requested experimentId'
        console.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
        throw AppError.notFound(errorMessage, undefined, getFullErrorCode('15U001'))
      }
      return data
    })

  @setErrorCode('158000')
  getExperimentById = (id, isTemplate, context) =>
    this.findExperimentWithTemplateCheck(id, isTemplate, context)
      .then((data) => {
        const promises = []

        promises.push(this.ownerService.getOwnersByExperimentId(id))
        promises.push(this.tagService.getTagsByExperimentId(id, isTemplate, context))
        promises.push(dbRead.comment.findRecentByExperimentId(data.id))
        promises.push(this.analysisModelService.getAnalysisModelByExperimentId(id))
        return Promise.all(promises).then(([owners, tags, comment, analysisModel]) => {
          data.owners = owners.user_ids
          data.ownerGroups = owners.group_ids
          data.reviewerUsers = owners.reviewer_user_ids
          data.reviewers = owners.reviewer_group_ids
          data.tags = ExperimentsService.prepareTagResponse(tags)
          if (!_.isNil(comment)) {
            data.comment = comment.description
          }
          if (analysisModel) {
            data.analysisModelType = analysisModel.analysis_model_type
            data.analysisModelSubType = analysisModel.analysis_model_sub_type
          }
          return data
        })
      })

  @notifyChanges('update', 0, 3)
  @setErrorCode('159000')
  @Transactional('updateExperiment')
  updateExperiment(experimentId, experiment, context, isTemplate, tx) {
    const id = Number(experimentId)
    experiment.isTemplate = isTemplate
    return this.securityService.permissionsCheck(id, context, isTemplate)
      .then(() => this.validator.validate([experiment], 'PUT')
        .then(() => dbWrite.experiments.update(id, experiment, context, tx)
          .then((data) => {
            if (!data) {
              const errorMessage = isTemplate ? 'Template Not Found to Update for id'
                : 'Experiment Not Found to Update for id'
              console.error(`[[${context.requestId}]] ${errorMessage} = ${id}`)
              throw AppError.notFound(errorMessage, undefined, getFullErrorCode('159001'))
            } else {
              const comment = {}
              if (!_.isNil(experiment.comment)) {
                comment.description = experiment.comment
                comment.experimentId = experiment.id
              }
              const trimmedUserIds = (experiment.owners || []).map(owner => owner.trim())
              const trimmedOwnerGroups = (experiment.ownerGroups || []).map(ownerGroup => ownerGroup.trim())
              const reviewersGroups = (experiment.reviewers || []).map(reviewerGroup => reviewerGroup.trim())
              const reviewers = (experiment.reviewerUsers || []).map(reviewer => reviewer.trim())
              const owners = {
                experimentId: id,
                userIds: trimmedUserIds,
                groupIds: trimmedOwnerGroups,
                reviewerGroupIds: reviewersGroups,
                reviewerIds: reviewers,
              }
              const updateOwnerPromise = this.ownerService.batchUpdateOwners([owners], context, tx)
              const promises = []
              let updateAnalysisModelService = null
              if (experiment.analysisModelType) {
                const analysisModelInfo = {
                  analysisModelType: experiment.analysisModelType,
                  analysisModelSubType: experiment.analysisModelSubType,
                  experimentId: id,
                }
                this.analysisModelService.getAnalysisModelByExperimentId(id).then((res) => {
                  if (!res) {
                    updateAnalysisModelService = this.analysisModelService.batchCreateAnalysisModel([analysisModelInfo], context, tx)
                  }
                  updateAnalysisModelService = this.analysisModelService.batchUpdateAnalysisModel([analysisModelInfo], context, tx)
                })
              } else {
                updateAnalysisModelService = this.analysisModelService.deleteAnalysisModelByExperimentId(id)
              }
              promises.push(updateAnalysisModelService)
              promises.push(updateOwnerPromise)

              if (experiment.comment && experiment.status === 'REJECTED') {
                const createExperimentCommentPromise = dbWrite.comment.batchCreate([comment], context, tx)
                promises.push(createExperimentCommentPromise)
              }
              promises.push(this.removeInvalidRandomizationConfig(experimentId, experiment.randomizationStrategyCode, tx))
              return tx.batch(promises)
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

  @setErrorCode('15T000')
  removeInvalidRandomizationConfig = async (experimentId, strategyCode, tx) => {
    const headers = await OAuthUtil.getAuthorizationHeaders()
    const { randomizeTreatmentsAPIUrl } = apiUrls
    const strategies = await HttpUtil.get(`${randomizeTreatmentsAPIUrl}/strategies`, headers)
    const randStrategy = _.find(strategies.body, strategy => strategy.strategyCode === strategyCode)
    await this.factorService.updateFactorsForDesign(experimentId, randStrategy, tx)
    await this.designSpecificationDetailService.deleteInvalidSpecsForRandomization(experimentId, randStrategy, tx)
  }

  @notifyChanges('delete', 0, 2)
  @setErrorCode('15A000')
  @Transactional('deleteExperiment')
  deleteExperiment(id, context, isTemplate, tx) {
    return this.securityService.permissionsCheck(id, context, isTemplate).then((permissions) => {
      if (permissions.includes('write')) {
        return this.locationAssocWithBlockService.getByExperimentId(id).then((associations) => {
          if (associations.length > 0) {
            throw AppError.badRequest('Unable to delete experiment as it is associated with a' +
              ' set', undefined, getFullErrorCode('15A002'))
          }
          return dbWrite.experiments.remove(id, isTemplate, tx)
            .then((data) => {
              if (!data) {
                console.error(`[[${context.requestId}]] Experiment Not Found for requested experimentId = ${id}`)
                throw AppError.notFound('Experiment Not Found for requested experimentId', undefined, getFullErrorCode('15A001'))
              } else {
                const url = `${apiUrls.capacityRequestAPIUrl}/requests/experiments/${id}`

                const promises = []
                const requestPromise = OAuthUtil.getAuthorizationHeaders()
                  .then(headers => HttpUtil.get(url, headers)
                    .then((response) => {
                      if (response && response.body) {
                        const putUrl = `${apiUrls.capacityRequestAPIUrl}/requests/${response.body.id}?type=${response.body.request_type}`
                        const modifiedData = {
                          request:
                            {
                              id: response.body.id,
                              experiment_id: null,
                            },
                        }

                        return HttpUtil.put(putUrl, headers, JSON.stringify(modifiedData))
                      }
                      return Promise.resolve()
                    })).catch((err) => {
                    if (err.status !== 404 && err.response.text !== `No requests for experiment ${id} were found.`) {
                      return Promise.reject(AppError.badRequest('Unable to delete Experiment', null, getFullErrorCode('15A004')))
                    }
                    return Promise.resolve()
                  })
                promises.push(requestPromise)
                promises.push(this.tagService.deleteTagsForExperimentId(id, context, isTemplate).then(() => data))

                return Promise.all(promises)
              }
            })
        })
      }
      throw AppError.unauthorized('Unauthorized to delete', undefined, getFullErrorCode('15A003'))
    })
  }

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
          return dbRead.experiments.batchFindExperimentOrTemplate(experimentIds, isTemplate)
            .then(experiments => ExperimentsService.mergeTagsWithExperiments(experiments, eTags))
        })
    })
  }

  @setErrorCode('15C000')
  getAllExperiments = isTemplate => dbRead.experiments.all(isTemplate)

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
    return this.securityService.canUserCreateExperiments(context)
      .then((canCreateExperiments) => {
        if (!canCreateExperiments) {
          return Promise.reject(AppError.forbidden('The user is not allowed to create experiments.', undefined, getFullErrorCode('15F003')))
        }
        const { source } = queryString
        let experimentPromise
        switch (source) {
          case undefined:
            experimentPromise = this.batchCreateExperiments(requestBody, context, false, tx)
            break
          case 'template': {
            const numberOfCopies = requestBody.numberOfCopies || 1
            experimentPromise = this.createEntity(requestBody.id, numberOfCopies,
              requestBody.name, context, false, tx).then((data) => {
              if (data && _.isArray(data)) {
                const tagsPromise = []
                _.forEach(_.range(numberOfCopies), (t) => {
                  const experimentId = data[t].id
                  const newTag = {
                    category: 'FROM TEMPLATE',
                    value: String(requestBody.id),
                    experimentId,
                  }
                  tagsPromise.push(this.tagService.getTagsByExperimentId(experimentId, false, context)
                    .then((result) => {
                      const tags = _.map(result, (tag) => {
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
            experimentPromise = this.copyEntities((requestBody.ids || requestBody.id),
              requestBody.numberOfCopies, requestBody.name,
              context, false, tx)
            break
          }
          default:
            experimentPromise = Promise.reject(AppError.badRequest('Invalid Source Type', undefined, getFullErrorCode('15F002')))
            break
        }
        return experimentPromise
      })
  }

  @setErrorCode('15G000')
  @Transactional('manageTemplates')
  manageTemplates(requestBody, queryString, context, tx) {
    return this.securityService.canUserCreateExperiments(context)
      .then((canCreateExperiments) => {
        if (!canCreateExperiments) {
          return Promise.reject(AppError.forbidden('The user is not allowed to create templates.', undefined, getFullErrorCode('15G002')))
        }
        const { source } = queryString
        let templatePromise
        switch (source) {
          case undefined:
            templatePromise = this.batchCreateTemplates(requestBody, context, tx)
            break
          case 'template': {
            templatePromise = this.copyEntities((requestBody.ids || requestBody.id), requestBody.numberOfCopies,
              requestBody.name, context, true, tx)
            break
          }
          case 'experiment': {
            const numberOfCopies = requestBody.numberOfCopies || 1
            templatePromise = this.createEntity(requestBody.id,
              numberOfCopies, requestBody.name,
              context, true, tx)
            break
          }
          default:
            templatePromise = Promise.reject(AppError.badRequest('Invalid Source Type', undefined, getFullErrorCode('15G001')))
            break
        }
        return templatePromise
      })
  }

  @setErrorCode('15V000')
  validateExperimentName = (name) => {
    if (name && name.length > 100) {
      throw AppError.badRequest('Experiment or template names cannot be longer than 100 characters', undefined, '15V001')
    }
  }

  @setErrorCode('15H000')
  createEntity(id, numberOfCopies, name, context, isTemplate, tx) {
    this.validateExperimentName(name)
    if (_.isNumber(id) && _.isNumber(numberOfCopies)) {
      return this.generateEntities([id], numberOfCopies, name,
        context, isTemplate, 'conversion', tx)
    }
    const entityCreatedFrom = isTemplate ? 'Experiment' : 'Template'
    return Promise.reject(AppError.badRequest(`Invalid ${entityCreatedFrom} Id or number of Copies`, undefined, getFullErrorCode('15H001')))
  }

  @setErrorCode('15I000')
  copyEntities(ids, numberOfCopies, name, context, isTemplate, tx) {
    this.validateExperimentName(name)

    if (_.isArray(ids) && ids.length !== 1) {
      return Promise.reject(AppError.badRequest('Only one experiment or template may be copied at a time', undefined, getFullErrorCode('15I001')))
    }

    const id = _.head(ids) || ids

    if (_.isNumber(id) && _.isNumber(numberOfCopies)) {
      return this.generateEntities([id], numberOfCopies, name,
        context, isTemplate, 'copy', tx)
    }
    return Promise.reject(AppError.badRequest('Invalid id or number of Copies', undefined, getFullErrorCode('15I002')))
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
  generateEntities(ids, numberOfCopies, name, context, isTemplate, source, tx) {
    const duplicationObj = {
      ids, numberOfCopies, isTemplate, name,
    }
    return this.duplicationService.duplicateExperiments(duplicationObj, context, source, tx)
  }

  @setErrorCode('15L000')
  static
  mergeTagsWithExperiments(experiments, entityTags) {
    const experimentsAndTagsMap = _.groupBy(entityTags, 'entityId')
    _.forEach(experiments, (experiment) => {
      experiment.tags = experimentsAndTagsMap[experiment.id] ?
        ExperimentsService.prepareTagResponse(experimentsAndTagsMap[experiment.id][0].tags) : []
    })
    return experiments
  }

  @setErrorCode('15M000')
  static
  prepareTagResponse(tags) {
    return _.map(tags, t => ({ category: t.category, value: t.value }))
  }

  @setErrorCode('15N000')
  getExperimentsByUser = (userId, isTemplate) => {
    if (!userId || !userId.slice) {
      return Promise.reject(AppError.badRequest('No UserId provided.', undefined, getFullErrorCode('15N001')))
    }
    if (userId.length !== 1) {
      return Promise.reject(AppError.badRequest('Multiple UserIds are not allowed.', undefined, getFullErrorCode('15N002')))
    }
    return this.securityService.getGroupsByUserId(userId[0]).then(groupIds =>
      dbRead.experiments.findExperimentsByUserIdOrGroup(isTemplate, userId[0], groupIds))
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

  @notifyChanges('update', 0)
  @setErrorCode('15P000')
  @Transactional('handleReviewStatus')
  handleReviewStatus = (experimentId, isTemplate, body, context, tx) => {
    const acceptableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']
    if (_.isNil(body.status)) {
      console.error('Error in handleReviewStatus - Status is not found in request body:', JSON.stringify(body))
      return Promise.reject(AppError.badRequest(`Status must be provided in body. Acceptable options are: ${acceptableStatuses.join(',')}`, null, getFullErrorCode('15P001')))
    }

    switch (body.status.toUpperCase()) {
      case 'DRAFT':
        return this.cancelReview(experimentId, isTemplate, context, tx)
      case 'SUBMITTED':
        if (_.isNil(body.timestamp)) {
          return Promise.reject(AppError.badRequest(`The timestamp field must be provided in body for submitting ${isTemplate ? 'a template' : 'an experiment'}`, null, getFullErrorCode('15P002')))
        }
        return this.submitForReview(experimentId, isTemplate, body.timestamp, context, tx)
      case 'APPROVED':
      case 'REJECTED':
        return this.submitReview(experimentId, isTemplate, body.status.toUpperCase(), body.comment, context, tx)
      default:
        return Promise.reject(AppError.badRequest(`Invalid status provided. Acceptable options are: ${acceptableStatuses.join(',')}`, null, getFullErrorCode('15P003')))
    }
  }

  @setErrorCode('15Q000')
  submitForReview = (experimentId, isTemplate, timestamp, context, tx) =>
    Promise.all([
      this.getExperimentById(experimentId, isTemplate, context),
      this.securityService.permissionsCheck(experimentId, context, isTemplate),
    ]).then(([experiment]) => {
      if (!_.isNil(experiment.task_id)) {
        return Promise.reject(AppError.badRequest(`${isTemplate ? 'Template' : 'Experiment'} has already been submitted for review. To submit a new review, please cancel the existing review.`, null, getFullErrorCode('15Q001')))
      }

      if (experiment.reviewers.length === 0 && experiment.reviewerUsers.length === 0) {
        return Promise.reject(AppError.badRequest(`No reviewers have been assigned to this ${isTemplate ? 'template' : 'experiment'}`, null, getFullErrorCode('15Q002')))
      }
      const date = new Date(timestamp)

      if (date instanceof Date && !_.isNaN(date.getTime())) {
        const isoDateString = date.toISOString()
        const currentISODateString = new Date().toISOString()

        if (isoDateString.slice(0, isoDateString.indexOf('T')) <= currentISODateString.slice(0, isoDateString.indexOf('T'))) {
          return Promise.reject(AppError.badRequest('Provided date must be greater than current date', null, getFullErrorCode('15Q004')))
        }

        const taskTemplate = {
          title: `${isTemplate ? 'Template' : 'Experiment'} "${experiment.name}" Review Requested`,
          body: {
            text: `${isTemplate ? 'Template' : 'Experiment'} "${experiment.name}" is ready for statistician review.`,
          },
          ...experiment.reviewerUsers.length > 0 && { recipients: experiment.reviewerUsers },
          ...experiment.reviewers.length > 0 && { userGroups: experiment.reviewers },
          actions: [
            {
              title: `Review ${isTemplate ? 'Template' : 'Experiment'} "${experiment.name}"`,
              url: `${apiUrls.velocityUrl}/experiments/${isTemplate ? 'templates/' : ''}${experimentId}`,
            },
          ],
          tags: [
            'experiment-review-request',
          ],
          dueDate: isoDateString.slice(0, isoDateString.indexOf('T')),
          tagKey: `${experimentId}|${isoDateString.slice(0, isoDateString.indexOf('T'))}`,
        }

        return OAuthUtil.getAuthorizationHeaders().then(headers =>
          HttpUtil.post(`${apiUrls.velocityMessagingAPIUrl}/tasks`, headers, taskTemplate)
            .then((taskResult) => {
              const taskId = taskResult.body.id
              return dbWrite.experiments.updateExperimentStatus(experimentId, 'SUBMITTED', taskId, context, tx)
            }),
        ).catch(err => Promise.reject(AppError.internalServerError('Error encountered contacting the velocity messaging api', err.message, '15Q005')))
      }

      return Promise.reject(AppError.badRequest('The timestamp field is an invalid date string', null, getFullErrorCode('15Q003')))
    })

  @setErrorCode('15R000')
  submitReview = (experimentId, isTemplate, status, comment, context, tx) =>
    Promise.all([
      this.getExperimentById(experimentId, isTemplate, context),
      this.securityService.getUserPermissionsForExperiment(experimentId, context),
    ]).then(([experiment, permissions]) => {
      if (!permissions.includes('review')) {
        return Promise.reject(AppError.forbidden('Only reviewers are allowed to submit a review', null, getFullErrorCode('15R001')))
      }

      if (experiment.status !== 'SUBMITTED') {
        return Promise.reject(AppError.badRequest(`${isTemplate ? 'Template' : 'Experiment'} has not been submitted for review`, null, getFullErrorCode('15R002')))
      }

      const taskID = experiment.task_id

      const newComment = {
        description: comment,
        experimentId,
      }

      if (_.isNil(taskID)) {
        return tx.batch([
          dbWrite.experiments.updateExperimentStatus(experimentId, status, null, context, tx),
          dbWrite.comment.batchCreate([newComment], context, tx),
        ])
      }

      return OAuthUtil.getAuthorizationHeaders().then(headers =>
        HttpUtil.put(`${apiUrls.velocityMessagingAPIUrl}/tasks/complete/${taskID}`, headers, { complete: true, completedBy: context.userId, result: 'Review Completed' })
          .catch((err) => {
            console.error(`Unable to complete task. Reason: ${err.response.text}`)
            if (err.status !== 404 && err.response.text !== 'task has already been completed') {
              return Promise.reject(AppError.badRequest('Unable to complete task', null, getFullErrorCode('15R003')))
            }

            return Promise.resolve()
          })
          .then(() => {
            this.notifyUsersReviewCompletion(isTemplate, experiment, status, comment)
            return tx.batch([
              dbWrite.experiments.updateExperimentStatus(experimentId, status, null, context, tx),
              dbWrite.comment.batchCreate([newComment], context, tx),
            ])
          }),
      )
    })

  @setErrorCode('15S000')
  cancelReview = (experimentId, isTemplate, context, tx) =>
    Promise.all([
      this.getExperimentById(experimentId, isTemplate, context),
      this.securityService.permissionsCheck(experimentId, context, isTemplate),
    ]).then(([experiment]) => {
      const taskID = experiment.task_id

      if (_.isNil(taskID)) {
        return dbWrite.experiments.updateExperimentStatus(experimentId, 'DRAFT', null, context, tx)
      }

      return OAuthUtil.getAuthorizationHeaders().then(headers =>
        HttpUtil.put(`${apiUrls.velocityMessagingAPIUrl}/tasks/complete/${taskID}`, headers, { complete: true, completedBy: context.userId, result: 'Review Cancelled' })
          .catch((err) => {
            console.error(`Unable to complete task. Reason: ${err.response.text}`)

            if (err.status !== 404 && err.response.text !== 'task has already been completed') {
              return Promise.reject(AppError.badRequest('Unable to complete task', null, getFullErrorCode('15S001')))
            }
            return Promise.resolve()
          })
          .then(() => dbWrite.experiments.updateExperimentStatus(experimentId, 'DRAFT', null, context, tx)),
      )
    })

  notifyUsersReviewCompletion = async (isTemplate, experiment, status, comment) => {
    const statusesForNotification = ['APPROVED', 'REJECTED']
    if (!statusesForNotification.includes(status)) {
      return
    }

    const experimentUrl = `${apiUrls.velocityUrl}/experiments/${isTemplate ? 'templates/' : ''}${experiment.id}`
    const experimentType = isTemplate ? 'Template' : 'Experiment'
    const message = status === 'REJECTED' ?
      `${experimentType} ${experiment.name} has been rejected. Reason: ${comment} ${experimentUrl}`
      : `${experimentType} ${experiment.name} has been approved ${experimentUrl}`
    const request = {
      title: `COMPLETED: ${experimentType} ${experiment.name} Review Request`,
      body: {
        text: message,
      },
      ...experiment.owners?.length > 0 && { recipients: experiment.owners },
      ...experiment.ownerGroups?.length > 0 && { userGroups: experiment.ownerGroups },
      tags: ['experiment-review-request'],
    }

    const headers = await OAuthUtil.getAuthorizationHeaders()
    HttpUtil.post(`${apiUrls.velocityMessagingAPIUrl}/messages`, headers, request)
      .catch(error =>
        console.error('Users are failed to be notified of the experiment review result', request, error),
      )
  }
}

module.exports = ExperimentsService

import _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import AppError from './utility/AppError'
import AppUtil from './utility/AppUtil'
import HttpUtil from './utility/HttpUtil'
import OAuthUtil from './utility/OAuthUtil'
import configurator from '../configs/configurator'
import { dbWrite, dbRead } from '../db/DbManager'
import { notifyChanges } from '../decorators/notifyChanges'

const apiUrls = configurator.get('urls')
const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 10XXXX
class CapacityRequestService {
  constructor(designSpecificationDetailService, unitSpecificationDetailService, securityService) {
    this.designSpecificationDetailService = designSpecificationDetailService
    this.unitSpecificationDetailService = unitSpecificationDetailService
    this.securityService = securityService
  }

  @setErrorCode('101000')
  static associateExperimentToCapacityRequest(experiment, context) {
    const capacityRequestUri = `${apiUrls.capacityRequestAPIUrl}/requests/${experiment.request.id}?type=${experiment.request.type}`
    return OAuthUtil.getAuthorizationHeaders()
      .then(headers => HttpUtil.get(capacityRequestUri, headers)
        .then((response) => {
          const capacityRequest = response.body
          capacityRequest.experiment_id = experiment.id
          const putBody = {
            currentUser: context.userId,
            request: capacityRequest,
          }

          return HttpUtil.put(capacityRequestUri, headers, putBody)
        }))
      .catch((err) => {
        console.error(`[[${context.requestId}]] Error received from Capacity Request API.`, err)
        throw CapacityRequestService.handleCapacityRequestError(err, getFullErrorCode('101001'))
      })
  }

  @setErrorCode('102000')
  static batchAssociateExperimentsToCapacityRequests(experiments, context) {
    const experimentsLinkedToCapacityRequests = _.filter(experiments, 'request')
    const capacityRequestPromises = _.map(experimentsLinkedToCapacityRequests,
      exp => CapacityRequestService.associateExperimentToCapacityRequest(exp, context))
    if (capacityRequestPromises.length === 0) {
      capacityRequestPromises.push(Promise.resolve())
    }
    return capacityRequestPromises
  }

  @setErrorCode('103000')
  static handleCapacityRequestError(err, errorCode) {
    if (err.status === 400) {
      return AppError.badRequest('Invalid capacity request information', undefined, errorCode)
    }

    if (err.status === 401) {
      return AppError.unauthorized(err.response.text, undefined, errorCode)
    }

    if (err.status === 403) {
      return AppError.forbidden(err.response.text, undefined, errorCode)
    }

    if (err.status === 404) {
      return AppError.badRequest('The associated capacity request does not exist', undefined, errorCode)
    }

    return {
      status: 500,
      code: 'Internal Server Error',
      message: `Error received from Capacity Request API: ${err.response.text}`,
      errorCode,
    }
  }

  @notifyChanges('update', 0)
  @setErrorCode('104000')
  @Transactional('capacityRequestSync')
  syncCapacityRequestDataWithExperiment(experimentId, capacityRequestData, context, tx) {
    return this.securityService.permissionsCheck(experimentId, context, false).then(() => {
      const syncPromises = []
      const designSpecificationDetailValues = _.pick(capacityRequestData, ['locations', 'reps'])
      return dbRead.locationAssociation.findNumberOfLocationsAssociatedWithSets(experimentId)
        .then((response) => {
          if (designSpecificationDetailValues.locations &&
            (designSpecificationDetailValues.locations < response.max)) {
            throw AppError.badRequest('Cannot sync capacity request data because some' +
              ' locations associated with sets would be removed', undefined, getFullErrorCode('104001'))
          }
          const unitSpecificationDetailKeys = ['number of rows', 'row length', 'row spacing', 'plot row length uom', 'row spacing uom']
          const unitSpecificationDetailValues =
            _.pick(capacityRequestData, unitSpecificationDetailKeys)

          if (_.keys(designSpecificationDetailValues).length > 0) {
            syncPromises.push(
              this.designSpecificationDetailService.syncDesignSpecificationDetails(
                designSpecificationDetailValues, experimentId, context, tx,
              ))
          }

          if (_.keys(unitSpecificationDetailValues).length > 0) {
            if (_.keys(unitSpecificationDetailValues).length
              !== unitSpecificationDetailKeys.length) {
              throw AppError.badRequest('Cannot sync capacity request data because some Unit Specification values are missing', undefined, getFullErrorCode('104002'))
            }
            syncPromises.push(
              this.unitSpecificationDetailService.syncUnitSpecificationDetails(
                unitSpecificationDetailValues, experimentId, context, tx,
              ))
          }
          syncPromises.push(
            dbWrite.experiments.updateCapacityRequestSyncDate(experimentId, context, tx))

          return tx.batch(syncPromises).then(() => AppUtil.createNoContentResponse())
        })
    })
  }
}

module.exports = CapacityRequestService

import log4js from 'log4js'
import _ from 'lodash'
import AppError from './utility/AppError'
import AppUtil from './utility/AppUtil'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'
import setErrorDecorator from '../decorators/setErrorDecorator'
import Transactional from '../decorators/transactional'
import DesignSpecificationDetailService from './DesignSpecificationDetailService'
import SecurityService from './SecurityService'
import db from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('CapacityRequestService')

// Error Codes 10XXXX
class CapacityRequestService {
  constructor() {
    this.designSpecificationDetailService = new DesignSpecificationDetailService()
    this.securityService = new SecurityService()
  }

  @setErrorCode('101000')
  static associateExperimentToCapacityRequest(experiment, context) {
    const capacityRequestUri = `${cfServices.experimentsExternalAPIUrls.value.capacityRequestAPIUrl}/requests/${experiment.request.id}?type=${experiment.request.type}`
    return PingUtil.getMonsantoHeader()
      .then(headers => HttpUtil.get(capacityRequestUri, headers)
        .then((response) => {
          const capacityRequest = response.body
          capacityRequest.protocol_number = experiment.id
          const putBody = {
            currentUser: context.userId,
            request: capacityRequest,
          }

          return HttpUtil.put(capacityRequestUri, headers, putBody)
        }))
      .catch((err) => {
        logger.error(`[[${context.requestId}]] Error received from Capacity Request API.`, err)
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
    } else if (err.status === 401) {
      return AppError.unauthorized(err.response.text, undefined, errorCode)
    } else if (err.status === 403) {
      return AppError.forbidden(err.response.text, undefined, errorCode)
    } else if (err.status === 404) {
      return AppError.badRequest('The associated capacity request does not exist', undefined, errorCode)
    }
    return {
      status: 500,
      code: 'Internal Server Error',
      message: `Error received from Capacity Request API: ${err.response.text}`,
      errorCode,
    }
  }

  @setErrorCode('104000')
  @Transactional('capacityRequestSync')
  syncCapacityRequestDataWithExperiment(experimentId, capacityRequestData, context, tx) {
    return this.securityService.permissionsCheck(experimentId, context, false, tx).then(() => {
      const syncPromises = []

      const designSpecificationDetailValues = _.pick(capacityRequestData, ['locations', 'reps'])

      if (_.keys(designSpecificationDetailValues).length > 0) {
        syncPromises.push(
          this.designSpecificationDetailService.syncDesignSpecificationDetails(
            designSpecificationDetailValues, experimentId, context, tx,
          ),
        )
      }

      syncPromises.push(db.experiments.updateCapacityRequestSyncDate(experimentId, context, tx))

      return Promise.all(syncPromises).then(() => AppUtil.createNoContentResponse())
    })
  }
}

module.exports = CapacityRequestService

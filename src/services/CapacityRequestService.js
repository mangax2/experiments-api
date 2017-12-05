import log4js from 'log4js'
import _ from 'lodash'
import AppError from './utility/AppError'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'

const logger = log4js.getLogger('CapacityRequestService')

class CapacityRequestService {
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
        logger.error(`[[${context.transactionId}]] Error received from Capacity Request API.`, err)
        throw CapacityRequestService.handleCapacityRequestError(err)
      })
  }

  static batchAssociateExperimentsToCapacityRequests(experiments, context) {
    const experimentsLinkedToCapacityRequests = _.filter(experiments, 'request')
    const capacityRequestPromises = _.map(experimentsLinkedToCapacityRequests,
      exp => CapacityRequestService.associateExperimentToCapacityRequest(exp, context))
    if (capacityRequestPromises.length === 0) {
      capacityRequestPromises.push(Promise.resolve())
    }
    return capacityRequestPromises
  }

  static handleCapacityRequestError(err) {
    if (err.status === 400) {
      return AppError.badRequest('Invalid capacity request information')
    } else if (err.status === 401) {
      return AppError.unauthorized(err.response.text)
    } else if (err.status === 403) {
      return AppError.forbidden(err.response.text)
    } else if (err.status === 404) {
      return AppError.badRequest('The associated capacity request does not exist')
    }
    return {
      status: 500,
      code: 'Internal Server Error',
      message: `Error received from Capacity Request API: ${err.response.text}`,
    }
  }
}

module.exports = CapacityRequestService

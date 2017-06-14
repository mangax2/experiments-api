import log4js from 'log4js'
import _ from 'lodash'
import HttpUtil from './utility/HttpUtil'
import PingUtil from './utility/PingUtil'
import cfServices from './utility/ServiceConfig'

const logger = log4js.getLogger('CapacityRequestService')

class CapacityRequestService {
  static associateExperimentToCapacityRequest(experiment, context) {
    const capacityRequestUri = `${cfServices.experimentsExternalAPIUrls.value.capacityRequestAPIUrl}/services/requests/${experiment.request.id}?type=${experiment.request.type}`
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
          logger.error('Error received from Capacity Request API.', err)
          return Promise.reject(err)
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
}

module.exports = CapacityRequestService

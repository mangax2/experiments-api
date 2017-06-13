import CapacityRequestService from '../../src/services/CapacityRequestService'
import cfServices from '../../src/services/utility/ServiceConfig'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'

describe('CapacityRequestService', () => {
  describe('associateExperimentToCapacityRequest', () => {
    const headers = [{ authorization: 'Bearer akldsjf;alksdjf;alksdjf;'}]
    const capacityRequest = { id: 5, protocol_number: 7 }

    beforeAll(() => {
      cfServices.experimentsExternalAPIUrls = {
        value: {
          capacityRequestAPIUrl: 'test'
        }
      }
    })

    it('resolves if nothing goes wrong', () => {
      PingUtil.getMonsantoHeader = jest.fn(() => Promise.resolve(headers))
      HttpUtil.get = jest.fn(() => Promise.resolve({ body: capacityRequest }))
      HttpUtil.put = jest.fn(() => Promise.resolve())
      const context = { userId: 'testUser' }
      const experiment = {
        id: 100,
        request: {
          id: 53,
          type: 'ce'
        }
      }

      return CapacityRequestService.associateExperimentToCapacityRequest(experiment, context)
        .then(() => {
          expect(PingUtil.getMonsantoHeader).toBeCalled()
          expect(HttpUtil.get).toBeCalledWith('test/services/requests/53?type=ce', headers)
          expect(capacityRequest.protocol_number).toBe(100)
          expect(HttpUtil.put).toBeCalledWith('test/services/requests/53?type=ce', headers, { currentUser: 'testUser', request: capacityRequest })
        })
    })

    it('rejects if something goes wrong', (done) => {
      PingUtil.getMonsantoHeader = jest.fn(() => Promise.reject('err'))
      HttpUtil.get = jest.fn(() => Promise.resolve({ body: capacityRequest }))
      HttpUtil.put = jest.fn(() => Promise.resolve())
      const context = { userId: 'testUser' }
      const experiment = {
        id: 100,
        request: {
          id: 53,
          type: 'ce'
        }
      }

      CapacityRequestService.associateExperimentToCapacityRequest(experiment, context)
        .catch((error) => {
          expect(error).toBe('err')
          expect(PingUtil.getMonsantoHeader).toBeCalled()
          expect(HttpUtil.get).not.toBeCalled()
          expect(HttpUtil.put).not.toBeCalledWith()
          done()
        })
    })
  })

  describe('batchAssociateExperimentsToCapacityRequests', () => {
    let originalFunction

    beforeAll(() => {
      originalFunction = CapacityRequestService.associateExperimentToCapacityRequest
    })

    it('calls associateExperimentToCapacityRequest once for each experiment with an associated request', () => {
      CapacityRequestService.associateExperimentToCapacityRequest = jest.fn(() => Promise.resolve())
      const experiments = [
        { request: {} },
        {},
        { owners: [], request: {} }
      ]

      const result = CapacityRequestService.batchAssociateExperimentsToCapacityRequests(experiments, {})

      expect(result.length).toBe(2)
      expect(CapacityRequestService.associateExperimentToCapacityRequest).toBeCalledWith(experiments[0], {})
      expect(CapacityRequestService.associateExperimentToCapacityRequest).toBeCalledWith(experiments[2], {})
    })

    it('returns an array with a single promise if no experiments have an associated request', () => {
      CapacityRequestService.associateExperimentToCapacityRequest = jest.fn()

      const result = CapacityRequestService.batchAssociateExperimentsToCapacityRequests([], {})

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(Promise.resolve())
      expect(CapacityRequestService.associateExperimentToCapacityRequest).not.toBeCalled()
    })

    afterAll(() => {
      CapacityRequestService.associateExperimentToCapacityRequest = originalFunction
    })
  })
})
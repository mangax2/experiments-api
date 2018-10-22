import CapacityRequestService from '../../src/services/CapacityRequestService'
import AppError from '../../src/services/utility/AppError'
import cfServices from '../../src/services/utility/ServiceConfig'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import db from '../../src/db/DbManager'
import {
  kafkaProducerMocker, mock, mockReject, mockResolve,
} from '../jestUtil'

describe('CapacityRequestService', () => {
  kafkaProducerMocker()

  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('associateExperimentToCapacityRequest', () => {
    const headers = [{ authorization: 'Bearer akldsjf;alksdjf;alksdjf;' }]
    const capacityRequest = { id: 5, experiment_id: 7 }
    let originalFunction

    beforeAll(() => {
      cfServices.experimentsExternalAPIUrls = {
        value: {
          capacityRequestAPIUrl: 'test',
        },
      }
      originalFunction = CapacityRequestService.handleCapacityRequestError
    })

    test('resolves if nothing goes wrong', () => {
      PingUtil.getMonsantoHeader = jest.fn(() => Promise.resolve(headers))
      HttpUtil.get = jest.fn(() => Promise.resolve({ body: capacityRequest }))
      HttpUtil.put = jest.fn(() => Promise.resolve())
      CapacityRequestService.handleCapacityRequestError = jest.fn(() => 'err')
      const context = { userId: 'testUser' }
      const experiment = {
        id: 100,
        request: {
          id: 53,
          type: 'ce',
        },
      }

      return CapacityRequestService.associateExperimentToCapacityRequest(experiment, context)
        .then(() => {
          expect(PingUtil.getMonsantoHeader).toBeCalled()
          expect(HttpUtil.get).toBeCalledWith('test/requests/53?type=ce', headers)
          expect(capacityRequest.experiment_id).toBe(100)
          expect(HttpUtil.put).toBeCalledWith('test/requests/53?type=ce', headers, { currentUser: 'testUser', request: capacityRequest })
          expect(CapacityRequestService.handleCapacityRequestError).not.toBeCalled()
        })
    })

    test('rejects if something goes wrong', (done) => {
      PingUtil.getMonsantoHeader = jest.fn(() => Promise.reject(new Error('err')))
      HttpUtil.get = jest.fn(() => Promise.resolve({ body: capacityRequest }))
      HttpUtil.put = jest.fn(() => Promise.resolve())
      CapacityRequestService.handleCapacityRequestError = jest.fn(() => 'err')
      const context = { userId: 'testUser' }
      const experiment = {
        id: 100,
        request: {
          id: 53,
          type: 'ce',
        },
      }

      CapacityRequestService.associateExperimentToCapacityRequest(experiment, context)
        .catch(() => {
          expect(PingUtil.getMonsantoHeader).toBeCalled()
          expect(HttpUtil.get).not.toBeCalled()
          expect(HttpUtil.put).not.toBeCalledWith()
          expect(CapacityRequestService.handleCapacityRequestError).toBeCalled()
          done()
        })
    })

    afterAll(() => {
      CapacityRequestService.handleCapacityRequestError = originalFunction
    })
  })

  describe('batchAssociateExperimentsToCapacityRequests', () => {
    let originalFunction

    beforeAll(() => {
      originalFunction = CapacityRequestService.associateExperimentToCapacityRequest
    })

    test('calls associateExperimentToCapacityRequest once for each experiment with an associated request', () => {
      CapacityRequestService.associateExperimentToCapacityRequest = jest.fn(() => Promise.resolve())
      const experiments = [
        { request: {} },
        {},
        { owners: [], request: {} },
      ]

      const result = CapacityRequestService.batchAssociateExperimentsToCapacityRequests(experiments, {})

      expect(result.length).toBe(2)
      expect(CapacityRequestService.associateExperimentToCapacityRequest).toBeCalledWith(experiments[0], {})
      expect(CapacityRequestService.associateExperimentToCapacityRequest).toBeCalledWith(experiments[2], {})
    })

    test('returns an array with a single promise if no experiments have an associated request', () => {
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

  describe('handleCapacityRequestError', () => {
    test('calls AppError.badRequest on 400', () => {
      AppError.badRequest = jest.fn()
      AppError.unauthorized = jest.fn()
      AppError.forbidden = jest.fn()

      CapacityRequestService.handleCapacityRequestError({ status: 400, response: { text: 'testText' } }, '5')

      expect(AppError.badRequest).toBeCalledWith('Invalid capacity request information', undefined, '5')
      expect(AppError.unauthorized).not.toBeCalled()
      expect(AppError.forbidden).not.toBeCalled()
    })

    test('calls AppError.badRequest on 404', () => {
      AppError.badRequest = jest.fn()
      AppError.unauthorized = jest.fn()
      AppError.forbidden = jest.fn()

      CapacityRequestService.handleCapacityRequestError({ status: 404, response: { text: 'testText' } }, '5')

      expect(AppError.badRequest).toBeCalledWith('The associated capacity request does not exist', undefined, '5')
      expect(AppError.unauthorized).not.toBeCalled()
      expect(AppError.forbidden).not.toBeCalled()
    })

    test('calls AppError.unauthorized on 401', () => {
      AppError.badRequest = jest.fn()
      AppError.unauthorized = jest.fn()
      AppError.forbidden = jest.fn()

      CapacityRequestService.handleCapacityRequestError({ status: 401, response: { text: 'testText' } }, '5')

      expect(AppError.unauthorized).toBeCalledWith('testText', undefined, '5')
      expect(AppError.badRequest).not.toBeCalled()
      expect(AppError.forbidden).not.toBeCalled()
    })

    test('calls AppError.forbidden on 403', () => {
      AppError.badRequest = jest.fn()
      AppError.unauthorized = jest.fn()
      AppError.forbidden = jest.fn()

      CapacityRequestService.handleCapacityRequestError({ status: 403, response: { text: 'testText' } }, '5')

      expect(AppError.forbidden).toBeCalledWith('testText', undefined, '5')
      expect(AppError.badRequest).not.toBeCalled()
      expect(AppError.unauthorized).not.toBeCalled()
    })

    test('does not call AppError on 500', () => {
      AppError.badRequest = jest.fn()
      AppError.unauthorized = jest.fn()
      AppError.forbidden = jest.fn()

      const response = CapacityRequestService.handleCapacityRequestError({ status: 500, response: { text: 'testText' } }, '5')

      expect(AppError.badRequest).not.toBeCalled()
      expect(AppError.unauthorized).not.toBeCalled()
      expect(AppError.forbidden).not.toBeCalled()
      expect(response).toEqual({
        status: 500,
        code: 'Internal Server Error',
        message: 'Error received from Capacity Request API: testText',
        errorCode: '5',
      })
    })
  })

  describe('syncCapacityRequestDataWithExperiment', () => {
    const testContext = {}
    const testTx = { tx: {} }

    test('it rejects when security service rejects', () => {
      const securityService = {
        permissionsCheck: mockReject(),
      }

      const designSpecificationDetailService = {
        syncDesignSpecificationDetails: mock(),
      }
      const unitSpecificationDetailService = {
        syncUnitSpecificationDetails: mock(),
      }

      const capacityRequestService = new CapacityRequestService(designSpecificationDetailService, unitSpecificationDetailService, securityService)
      db.experiments = {
        updateCapacityRequestSyncDate: mockResolve(),
      }

      const capacityRequestData = {
        locations: 4,
        reps: 3,
      }

      return capacityRequestService.syncCapacityRequestDataWithExperiment(1, capacityRequestData, testContext, testTx).then(() => {}, () => {
        expect(db.experiments.updateCapacityRequestSyncDate).not.toHaveBeenCalled()
        expect(capacityRequestService.designSpecificationDetailService.syncDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(capacityRequestService.unitSpecificationDetailService.syncUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })

    test('calls designSpecificationDetailService and update capacity request sync date', () => {
      const securityService = {
        permissionsCheck: mockResolve(),
      }
      const designSpecificationDetailService = {
        syncDesignSpecificationDetails: mockResolve(),
      }
      const unitSpecificationDetailService = {
        syncUnitSpecificationDetails: mockResolve(),
      }
      const capacityRequestService = new CapacityRequestService(designSpecificationDetailService, unitSpecificationDetailService, securityService)

      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ count: 3 }),
      }
      db.experiments = {
        updateCapacityRequestSyncDate: mockResolve(),
      }

      const capacityRequestData = {
        locations: 4,
        reps: 3,
      }
      return capacityRequestService.syncCapacityRequestDataWithExperiment(1, capacityRequestData, testContext, testTx).then(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(db.experiments.updateCapacityRequestSyncDate).toHaveBeenCalled()
        expect(capacityRequestService.designSpecificationDetailService.syncDesignSpecificationDetails).toHaveBeenCalled()
        expect(capacityRequestService.unitSpecificationDetailService.syncUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })

    test('Fails to call designSpecificationDetailService and update capacity request sync date ', () => {
      const securityService = {
        permissionsCheck: mockResolve(),
      }
      const designSpecificationDetailService = {
        syncDesignSpecificationDetails: mockResolve(),
      }
      const unitSpecificationDetailService = {
        syncUnitSpecificationDetails: mockResolve(),
      }
      const capacityRequestService = new CapacityRequestService(designSpecificationDetailService, unitSpecificationDetailService, securityService)

      db.locationAssociation = {
        findNumberOfLocationsAssociatedWithSets: mockResolve({ count: 5 }),
      }
      db.experiments = {
        updateCapacityRequestSyncDate: mockResolve(),
      }

      const capacityRequestData = {
        locations: 4,
        reps: 3,
      }
      AppError.badRequest = mock()
      return capacityRequestService.syncCapacityRequestDataWithExperiment(1, capacityRequestData, testContext, testTx).catch(() => {
        expect(db.locationAssociation.findNumberOfLocationsAssociatedWithSets).toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalled()
        expect(db.experiments.updateCapacityRequestSyncDate).not.toHaveBeenCalled()
        expect(capacityRequestService.designSpecificationDetailService.syncDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(capacityRequestService.unitSpecificationDetailService.syncUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })

    test('calls unitSpecificationDetailService and update capacity request sync date', () => {
      const securityService = {
        permissionsCheck: mockResolve(),
      }
      const designSpecificationDetailService = {
        syncDesignSpecificationDetails: mockResolve(),
      }
      const unitSpecificationDetailService = {
        syncUnitSpecificationDetails: mockResolve(),
      }
      const capacityRequestService = new CapacityRequestService(designSpecificationDetailService, unitSpecificationDetailService, securityService)
      db.experiments = {
        updateCapacityRequestSyncDate: mockResolve(),
      }

      const capacityRequestData = {
        'row length': 4,
        'row spacing': 5,

      }

      return capacityRequestService.syncCapacityRequestDataWithExperiment(1, capacityRequestData, testContext, testTx).then(() => {
        expect(db.experiments.updateCapacityRequestSyncDate).toHaveBeenCalledWith(1, testContext, testTx)
        expect(capacityRequestService.designSpecificationDetailService.syncDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(capacityRequestService.unitSpecificationDetailService.syncUnitSpecificationDetails).toHaveBeenCalled()
      })
    })

    test('only calls to update capacity request sync date when nothing to sync', () => {
      const securityService = {
        permissionsCheck: mockResolve(),
      }
      const designSpecificationDetailService = {
        syncDesignSpecificationDetails: mockResolve(),
      }
      const unitSpecificationDetailService = {
        syncUnitSpecificationDetails: mockResolve(),
      }

      db.experiments = {
        updateCapacityRequestSyncDate: mockResolve(),
      }
      const capacityRequestService = new CapacityRequestService(designSpecificationDetailService, unitSpecificationDetailService, securityService)

      const capacityRequestData = {}

      return capacityRequestService.syncCapacityRequestDataWithExperiment(1, capacityRequestData, testContext, testTx).then(() => {
        expect(capacityRequestService.designSpecificationDetailService.syncDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(capacityRequestService.unitSpecificationDetailService.syncUnitSpecificationDetails).not.toHaveBeenCalled()
        expect(db.experiments.updateCapacityRequestSyncDate).toHaveBeenCalledWith(1, testContext, testTx)
      })
    })
  })
})

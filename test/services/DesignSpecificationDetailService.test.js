import {
  kafkaProducerMocker, mock, mockReject, mockResolve,
} from '../jestUtil'
import DesignSpecificationDetailService from '../../src/services/DesignSpecificationDetailService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'
import db from '../../src/db/DbManager'

jest.mock('../../src/services/utility/HttpUtil')
jest.mock('../../src/services/utility/PingUtil')

describe('DesignSpecificationDetailService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  kafkaProducerMocker()

  beforeEach(() => {
    expect.hasAssertions()
    target = new DesignSpecificationDetailService()
  })

  describe('getDesignSpecificationDetailsByExperimentId', () => {
    test('gets design specification details', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{}])

      return target.getDesignSpecificationDetailsByExperimentId(1, false, testContext, testTx).then((data) => {
        expect(db.designSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('rejects when findAllByExperimentId fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockReject(error)

      return target.getDesignSpecificationDetailsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(db.designSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      db.designSpecificationDetail.findAllByExperimentId = mock()

      return target.getDesignSpecificationDetailsByExperimentId(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, testContext, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
  describe('batchCreateDesignSpecificationDetails', () => {
    test('creates design specification details', () => {
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.designSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchCreate = mockReject(error)

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.designSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.designSpecificationDetail.batchCreate = mockReject(error)

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.designSpecificationDetail.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('batchUpdateDesignSpecificationDetails', () => {
    test('updates design specification details', () => {
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.designSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchUpdate = mockReject(error)

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.designSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      db.designSpecificationDetail.batchUpdate = mockReject(error)

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.designSpecificationDetail.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('manageAllDesignSpecificationDetails', () => {
    test('manages delete, update, and create design specification details call', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockResolve()
      target.updateDesignSpecificationDetails = mockResolve()
      target.createDesignSpecificationDetails = mockResolve()
      target.refDesignSpecificationService.getAllRefDesignSpecs = mockResolve([{ name: 'Randomization Strategy ID', id: 1 }])
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createDesignSpecificationDetails).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('manages delete, update, and create design specification details call and calls out to clear factor tiers', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockResolve()
      target.updateDesignSpecificationDetails = mockResolve()
      target.createDesignSpecificationDetails = mockResolve()
      target.refDesignSpecificationService.getAllRefDesignSpecs = mockResolve([{ name: 'Randomization Strategy ID', id: 1 }])
      AppUtil.createCompositePostResponse = mock()
      PingUtil.getMonsantoHeader.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.get.mockReturnValueOnce(Promise.resolve({ body: [{ id: 8 }] }))
      target.factorService.updateFactorsForDesign = mockResolve()
      db.experiments = { updateStrategyCode: mockResolve() }

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{ refDesignSpecId: 1, value: '8' }],
        adds: [{}, {}],
      }, 1, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).toHaveBeenCalledWith([{ refDesignSpecId: 1, value: '8' }], testContext, testTx)
        expect(target.createDesignSpecificationDetails).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(target.factorService.updateFactorsForDesign).toHaveBeenCalledWith(1, { id: 8 }, testTx)
        expect(db.experiments.updateStrategyCode).toHaveBeenCalledWith(1, { id: 8 }, testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    test('returns nothing when designSpecificationDetailsObj is null', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mock()
      target.updateDesignSpecificationDetails = mock()
      target.createDesignSpecificationDetails = mock()
      target.refDesignSpecificationService.getAllRefDesignSpecs = mockResolve([{ name: 'Randomization Strategy ID', id: 1 }])
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails(null, 1, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.populateExperimentId).not.toHaveBeenCalled()
        expect(target.deleteDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(target.updateDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(target.createDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
      })
    })

    test('rejects when create fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockResolve()
      target.updateDesignSpecificationDetails = mockResolve()
      target.createDesignSpecificationDetails = mockReject(error)
      target.refDesignSpecificationService.getAllRefDesignSpecs = mockResolve([{ name: 'Randomization Strategy ID', id: 1 }])
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, false, testTx).then(null, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createDesignSpecificationDetails).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when update fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockResolve()
      target.updateDesignSpecificationDetails = mockReject(error)
      target.createDesignSpecificationDetails = mockResolve()
      target.refDesignSpecificationService.getAllRefDesignSpecs = mockResolve([{ name: 'Randomization Strategy ID', id: 1 }])
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when delete fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockReject(error)
      target.updateDesignSpecificationDetails = mockResolve()
      target.createDesignSpecificationDetails = mockResolve()
      target.refDesignSpecificationService.getAllRefDesignSpecs = mockResolve([{ name: 'Randomization Strategy ID', id: 1 }])
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, false, testTx).then(null, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(target.createDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('deleteDesignSpecificationDetails', () => {
    test('deletes design specification details', () => {
      db.designSpecificationDetail.batchRemove = mockResolve([1])
      return target.deleteDesignSpecificationDetails([1], testContext, testTx).then((data) => {
        expect(db.designSpecificationDetail.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    test('resolves when no ids are passed in for delete', () => {
      db.designSpecificationDetail.batchRemove = mock()

      return target.deleteDesignSpecificationDetails([], testContext, testTx).then(() => {
        expect(db.designSpecificationDetail.batchRemove).not.toHaveBeenCalled()
      })
    })

    test('throws an error when not all design specification details are found for delete', () => {
      db.designSpecificationDetail.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.deleteDesignSpecificationDetails([1, 2], testContext, testTx).then(() => {}, () => {
        expect(db.designSpecificationDetail.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all design specification detail ids requested for delete were found', undefined, '137001')
      })
    })
  })

  describe('updateDesignSpecificationDetails', () => {
    test('updates design specification details', () => {
      target.batchUpdateDesignSpecificationDetails = mockResolve([{}])

      return target.updateDesignSpecificationDetails([{ experimentId: 1 }], testContext, testTx).then((data) => {
        expect(target.batchUpdateDesignSpecificationDetails).toHaveBeenCalledWith([{ experimentId: 1 }], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('does not update design specification details when none are passed in', () => {
      target.batchUpdateUnitSpecificationDetails = mock()

      return target.updateDesignSpecificationDetails([], testTx).then(() => {
        expect(target.batchUpdateUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })

  describe('createDesignSpecificationDetails', () => {
    test('creates design specification details', () => {
      target.batchCreateDesignSpecificationDetails = mockResolve([{}])

      return target.createDesignSpecificationDetails([{ experimentId: 1 }], testContext, testTx).then((data) => {
        expect(target.batchCreateDesignSpecificationDetails).toHaveBeenCalledWith([{ experimentId: 1 }], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    test('does not create design specification details', () => {
      target.batchCreateDesignSpecificationDetails = mock()

      return target.createDesignSpecificationDetails([], testContext, testTx).then(() => {
        expect(target.batchCreateDesignSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })

  describe('populateExperimentId', () => {
    test('populates experimentId in design specification detail objects', () => {
      const data = [{ id: 1, refDesignSpecId: 1, value: 10 }]
      target.populateExperimentId(data, 1)
      expect(data).toEqual([{
        id: 1, refDesignSpecId: 1, value: 10, experimentId: 1,
      }])
    })
  })

  describe('getAdvancedParameters', () => {
    test('massages the data as expected', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{
        ref_design_spec_id: 3,
        value: '4',
      }, {
        ref_design_spec_id: 5,
        value: 'test Value',
      }])
      db.refDesignSpecification.all = mockResolve([{
        name: 'test Spec',
        id: 5,
      }, {
        name: 'unused Spec',
        id: 7,
      }, {
        name: 'min Reps',
        id: 3,
      }])

      return target.getAdvancedParameters(1, false, testTx).then((result) => {
        expect(target.experimentService.getExperimentById).toBeCalled()
        expect(db.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(db.refDesignSpecification.all).toBeCalled()
        expect(result).toEqual({
          minReps: '4',
          testSpec: 'test Value',
        })
      })
    })
  })

  describe('syncDesignSpecificationDetails', () => {
    test('returns a resolved promise when there are no design specification details to sync', () => {
      target = new DesignSpecificationDetailService()
      target.getDesignSpecificationDetailsByExperimentId = mockResolve([])
      target.refDesignSpecificationService = {
        getAllRefDesignSpecs: mockResolve([]),
      }
      db.designSpecificationDetail.syncDesignSpecificationDetails = mock()

      return target.syncDesignSpecificationDetails({}, 1, testContext, testTx).then(() => {
        expect(db.designSpecificationDetail.syncDesignSpecificationDetails).not.toHaveBeenCalled()
      })
    })

    test('rejects when it fails to get ref design specifications', () => {
      target = new DesignSpecificationDetailService()
      target.getDesignSpecificationDetailsByExperimentId = mockResolve([])
      target.refDesignSpecificationService = {
        getAllRefDesignSpecs: mockReject(),
      }
      db.designSpecificationDetail.syncDesignSpecificationDetails = mock()

      return target.syncDesignSpecificationDetails({}, 1, testContext, testTx).then(() => {}, () => {
        expect(db.designSpecificationDetail.syncDesignSpecificationDetails).not.toHaveBeenCalled()
      })
    })

    test('rejects when it fails to get design specification details', () => {
      target = new DesignSpecificationDetailService()
      target.getDesignSpecificationDetailsByExperimentId = mockReject()
      target.refDesignSpecificationService = {
        getAllRefDesignSpecs: mockReject(),
      }
      db.designSpecificationDetail.syncDesignSpecificationDetails = mockResolve()

      return target.syncDesignSpecificationDetails({}, 1, testContext, testTx).then(() => {}, () => {
        expect(db.designSpecificationDetail.syncDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(target.refDesignSpecificationService.getAllRefDesignSpecs).not.toHaveBeenCalled()
      })
    })

    test('adds a location and rep design for upsert', () => {
      target = new DesignSpecificationDetailService()
      target.getDesignSpecificationDetailsByExperimentId = mockResolve([])
      target.manageAllDesignSpecificationDetails = mock()
      target.refDesignSpecificationService = {
        getAllRefDesignSpecs: mockResolve([{ id: 1, name: 'Locations' }, { id: 2, name: 'Reps' }, { id: 3, name: 'Min Rep' }]),
      }
      db.designSpecificationDetail.syncDesignSpecificationDetails = mockResolve()

      const capacityRequestDesignSpecificationDetails = {
        locations: 5,
        reps: 4,
      }

      return target.syncDesignSpecificationDetails(capacityRequestDesignSpecificationDetails, 1, testContext, testTx).then(() => {
        expect(db.designSpecificationDetail.syncDesignSpecificationDetails).toHaveBeenCalledWith(
          1,
          [
            { value: 5, refDesignSpecId: 1 },
            { value: 4, refDesignSpecId: 2 },
          ],
          testContext,
          testTx,
        )
      })
    })

    test('adds a location but does nothing for reps when min reps are defined', () => {
      target = new DesignSpecificationDetailService()
      target.getDesignSpecificationDetailsByExperimentId = mockResolve([
        { id: 1, ref_design_spec_id: 1, value: '1' },
        { id: 2, ref_design_spec_id: 3, value: '8' },
      ])
      target.refDesignSpecificationService = {
        getAllRefDesignSpecs: mockResolve([
          { id: 1, name: 'Locations' },
          { id: 2, name: 'Reps' },
          { id: 3, name: 'Min Rep' }]),
      }
      db.designSpecificationDetail.syncDesignSpecificationDetails = mockResolve()

      const capacityRequestDesignSpecificationDetails = {
        locations: 5,
        reps: 4,
      }

      return target.syncDesignSpecificationDetails(capacityRequestDesignSpecificationDetails, 1, testContext, testTx).then(() => {
        expect(db.designSpecificationDetail.syncDesignSpecificationDetails).toHaveBeenCalledWith(
          1,
          [
            { value: 5, refDesignSpecId: 1 },
          ],
          testContext,
          testTx,
        )
      })
    })
  })
})

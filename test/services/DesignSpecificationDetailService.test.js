import {
  kafkaProducerMocker, mock, mockReject, mockResolve,
} from '../jestUtil'
import DesignSpecificationDetailService from '../../src/services/DesignSpecificationDetailService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import { dbRead, dbWrite } from '../../src/db/DbManager'

jest.mock('../../src/services/utility/HttpUtil')
jest.mock('../../src/services/utility/OAuthUtil')

describe('DesignSpecificationDetailService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }
  kafkaProducerMocker()

  beforeEach(() => {
    target = new DesignSpecificationDetailService()
  })
  describe('batchCreateDesignSpecificationDetails', () => {
    test('creates design specification details', () => {
      target.validator.validate = mockResolve()
      dbWrite.designSpecificationDetail.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.designSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.designSpecificationDetail.batchCreate = mockReject(error)

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.designSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.designSpecificationDetail.batchCreate = mockReject(error)

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.designSpecificationDetail.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('does not create design specification details when none are passed in', () => {
      dbWrite.designSpecificationDetail.batchCreate = mockResolve([{}])

      return target.batchCreateDesignSpecificationDetails([], testContext, testTx).then(() => {
        expect(dbWrite.designSpecificationDetail.batchCreate).not.toHaveBeenCalled()
      })
    })
  })

  describe('batchUpdateDesignSpecificationDetails', () => {
    test('updates design specification details', () => {
      target.validator.validate = mockResolve()
      dbWrite.designSpecificationDetail.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.designSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    test('rejects when batchUpdate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      dbWrite.designSpecificationDetail.batchUpdate = mockReject(error)

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.designSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      dbWrite.designSpecificationDetail.batchUpdate = mockReject(error)

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT')
        expect(dbWrite.designSpecificationDetail.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('does not update design specification details when none are passed in', () => {
      dbWrite.designSpecificationDetail.batchUpdate = mockResolve([{}])

      return target.batchUpdateDesignSpecificationDetails([], testContext, testTx).then(() => {
        expect(dbWrite.designSpecificationDetail.batchUpdate).not.toHaveBeenCalled()
      })
    })
  })

  describe('deleteDesignSpecificationDetails', () => {
    test('deletes design specification details', () => {
      dbWrite.designSpecificationDetail.batchRemove = mockResolve([1])
      return target.deleteDesignSpecificationDetails([1], testContext, testTx).then((data) => {
        expect(dbWrite.designSpecificationDetail.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    test('resolves when no ids are passed in for delete', () => {
      dbWrite.designSpecificationDetail.batchRemove = mock()

      return target.deleteDesignSpecificationDetails([], testContext, testTx).then(() => {
        expect(dbWrite.designSpecificationDetail.batchRemove).not.toHaveBeenCalled()
      })
    })

    test('throws an error when not all design specification details are found for delete', () => {
      dbWrite.designSpecificationDetail.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.deleteDesignSpecificationDetails([1, 2], testContext, testTx).then(() => {}, () => {
        expect(dbWrite.designSpecificationDetail.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all design specification detail ids requested for delete were found', undefined, '137001')
      })
    })
  })

  describe('getAdvancedParameters', () => {
    test('massages the data as expected', () => {
      dbRead.designSpecificationDetail.findAllByExperimentId = mockResolve([{
        ref_design_spec_id: 3,
        value: '4',
      }, {
        ref_design_spec_id: 5,
        value: 'test Value',
      }])
      dbRead.refDesignSpecification.all = mockResolve([{
        name: 'test Spec',
        id: 5,
      }, {
        name: 'unused Spec',
        id: 7,
      }, {
        name: 'min Reps',
        id: 3,
      }])

      return target.getAdvancedParameters(1, testTx).then((result) => {
        expect(dbRead.designSpecificationDetail.findAllByExperimentId).toBeCalled()
        expect(dbRead.refDesignSpecification.all).toBeCalled()
        expect(result).toEqual({
          minReps: '4',
          testSpec: 'test Value',
        })
      })
    })
  })

  describe('saveDesignSpecifications', () => {
    test('correctly classifies design specs as adds, updates and deletes', () => {
      dbRead.designSpecificationDetail = {
        findAllByExperimentId: mockResolve([
          { id: 3, ref_design_spec_id: 11, value: 'test 1' },
          { id: 4, ref_design_spec_id: 12, value: 'test 2' },
          { id: 2, ref_design_spec_id: 14, value: 'randStrat' },
          { id: 6, ref_design_spec_id: 15, value: 'test 3' },
        ]),
      }
      dbRead.refDesignSpecification = {
        all: mockResolve([
          { id: 11, name: 'Something Else' },
          { id: 12, name: 'Locations' },
          { id: 13, name: 'Reps' },
          { id: 14, name: 'Randomization Strategy ID' },
          { id: 15, name: 'Min Reps' },
        ]),
      }
      const designSpecs = { locations: '5', reps: '3', minReps: '' }
      target = new DesignSpecificationDetailService()
      target.deleteDesignSpecificationDetails = mockResolve()
      target.batchUpdateDesignSpecificationDetails = mockResolve()
      target.batchCreateDesignSpecificationDetails = mockResolve()
      target.securityService.permissionsCheck = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.saveDesignSpecifications(designSpecs, 5, false, testContext, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toBeCalledWith(5, testContext, false)
        expect(dbRead.designSpecificationDetail.findAllByExperimentId).toBeCalledWith(5)
        expect(dbRead.refDesignSpecification.all).toBeCalled()
        expect(target.deleteDesignSpecificationDetails).toBeCalledWith([3, 6], testContext, testTx)
        expect(target.batchUpdateDesignSpecificationDetails).toBeCalledWith([{
          id: 4, refDesignSpecId: 12, value: '5', hasMatch: true,
        }], testContext, testTx)
        expect(target.batchCreateDesignSpecificationDetails).toBeCalledWith([
          { value: '3', experimentId: 5, refDesignSpecId: 13 },
        ], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toBeCalled()
      })
    })
  })

  describe('syncDesignSpecificationDetails', () => {
    test('returns a resolved promise when there are no design specification details to sync', () => {
      target = new DesignSpecificationDetailService()
      target.getAdvancedParameters = mockResolve({})
      target.saveDesignSpecifications = mock()

      return target.syncDesignSpecificationDetails({}, 1, testContext, testTx).then(() => {
        expect(target.saveDesignSpecifications).not.toHaveBeenCalled()
      })
    })

    test('rejects when it fails to get design specification details', () => {
      target = new DesignSpecificationDetailService()
      target.getAdvancedParameters = mockReject()
      target.saveDesignSpecifications = mockResolve()

      return target.syncDesignSpecificationDetails({}, 1, testContext, testTx).then(() => {}, () => {
        expect(target.saveDesignSpecifications).not.toHaveBeenCalled()
      })
    })

    test('adds a location and rep design for upsert', () => {
      target = new DesignSpecificationDetailService()
      target.getAdvancedParameters = mockResolve({})
      target.saveDesignSpecifications = mockResolve()

      const capacityRequestDesignSpecificationDetails = {
        locations: 5,
        reps: 4,
      }

      return target.syncDesignSpecificationDetails(capacityRequestDesignSpecificationDetails, 1, testContext, testTx).then(() => {
        expect(target.saveDesignSpecifications).toHaveBeenCalledWith(
          { locations: '5', reps: '4' },
          1,
          false,
          testContext,
          testTx,
        )
      })
    })

    test('adds a location but does nothing for reps when min reps are defined', () => {
      target = new DesignSpecificationDetailService()
      target.getAdvancedParameters = mockResolve({ locations: '1', minRep: '8' })
      target.saveDesignSpecifications = mockResolve()

      const capacityRequestDesignSpecificationDetails = {
        locations: 5,
        reps: 4,
      }

      return target.syncDesignSpecificationDetails(capacityRequestDesignSpecificationDetails, 1, testContext, testTx).then(() => {
        expect(target.saveDesignSpecifications).toHaveBeenCalledWith(
          { locations: '5', minRep: '8' },
          1,
          false,
          testContext,
          testTx,
        )
      })
    })
  })

  describe('deleteInvalidSpecsForRandomization', () => {
    test('calls deleteByExperimentAndKey with the correct key if the strategy does not allow borders', async () => {
      target = new DesignSpecificationDetailService()
      dbRead.refDesignSpecification.all = mockResolve([
        { id: 2, name: 'Reps' },
        { id: 3, name: 'Border Size' },
        { id: 4, name: 'Locations' },
      ])
      dbWrite.designSpecificationDetail.deleteByExperimentAndKey = mockResolve()
      const randomizationStrategy = { rules: {} }

      await target.deleteInvalidSpecsForRandomization(5, randomizationStrategy, testTx)

      expect(dbWrite.designSpecificationDetail.deleteByExperimentAndKey).toHaveBeenCalledWith(5, [3], testTx)
    })

    test('does not call deleteExperimentAndKey if the strategy does allow borders', async () => {
      target = new DesignSpecificationDetailService()
      dbRead.refDesignSpecification.all = mockResolve([
        { id: 2, name: 'Reps' },
        { id: 3, name: 'Border Size' },
        { id: 4, name: 'Locations' },
      ])
      dbWrite.designSpecificationDetail.deleteByExperimentAndKey = mockResolve()
      const randomizationStrategy = { rules: { buffers: { border: true } } }

      await target.deleteInvalidSpecsForRandomization(5, randomizationStrategy, testTx)

      expect(dbWrite.designSpecificationDetail.deleteByExperimentAndKey).not.toHaveBeenCalled()
    })
  })
})

import { mock, mockReject, mockResolve } from '../jestUtil'
import DesignSpecificationDetailService from '../../src/services/DesignSpecificationDetailService'
import AppError from '../../src/services/utility/AppError'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'

describe('DesignSpecificationDetailService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
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

  describe('getDesignSpecificationDetailById', () => {
    test('gets a design specification detail', () => {
      db.designSpecificationDetail.find = mockResolve({})

      return target.getDesignSpecificationDetailById(1, {}, testTx).then((data) => {
        expect(db.designSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    test('throws an error when find returns empty', () => {
      db.designSpecificationDetail.find = mockResolve()
      AppError.notFound = mock()

      return target.getDesignSpecificationDetailById(1, {}, testTx).then(() => {}, () => {
        expect(db.designSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Design Specification Detail Not Found for requested id', undefined, '132001')
      })
    })

    test('rejects when find fails', () => {
      const error = { message: 'error' }
      db.designSpecificationDetail.find = mockReject(error)

      return target.getDesignSpecificationDetailById(1, {}, testTx).then(() => {}, (err) => {
        expect(db.designSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
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

    test('returns nothing when designSpecificationDetailsObj is null', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mock()
      target.updateDesignSpecificationDetails = mock()
      target.createDesignSpecificationDetails = mock()
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
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, false, testTx).then(() => {}, (err) => {
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
})

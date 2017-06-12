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
    it('gets design specification details', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockResolve([{}])

      return target.getDesignSpecificationDetailsByExperimentId(1, testTx).then((data) => {
        expect(db.designSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('rejects when findAllByExperimentId fails', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.designSpecificationDetail.findAllByExperimentId = mockReject('error')

      return target.getDesignSpecificationDetailsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(db.designSpecificationDetail.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getExperimentById fails', () => {
      target.experimentService.getExperimentById = mockReject('error')
      db.designSpecificationDetail.findAllByExperimentId = mock()

      return target.getDesignSpecificationDetailsByExperimentId(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.designSpecificationDetail.findAllByExperimentId).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getDesignSpecificationDetailById', () => {
    it('gets a design specification detail', () => {
      db.designSpecificationDetail.find = mockResolve({})

      return target.getDesignSpecificationDetailById(1, testTx).then((data) => {
        expect(db.designSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when find returns empty', () => {
      db.designSpecificationDetail.find = mockResolve()
      AppError.notFound = mock()

      return target.getDesignSpecificationDetailById(1, testTx).then(() => {}, () => {
        expect(db.designSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Design Specification Detail Not Found for' +
          ' requested id')
      })
    })

    it('rejects when find fails', () => {
      db.designSpecificationDetail.find = mockReject('error')

      return target.getDesignSpecificationDetailById(1, testTx).then(() => {}, (err) => {
        expect(db.designSpecificationDetail.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchGetDesignSpecificationDetailsByIds', () => {
    it('gets design specification details', () => {
      db.designSpecificationDetail.batchFind = mockResolve([{}])

      return target.batchGetDesignSpecificationDetailsByIds([1], testTx).then((data) => {
        expect(db.designSpecificationDetail.batchFind).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([{}])
      })
    })

    it('throws an error when not all requested ids are returned', () => {
      db.designSpecificationDetail.batchFind = mockResolve([{}])
      AppError.notFound = mock()

      return target.batchGetDesignSpecificationDetailsByIds([1, 2], testTx).then(() => {}, () => {
        expect(db.designSpecificationDetail.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Design Specification Detail not found for' +
          ' all requested ids.')
      })
    })

    it('rejects when batchFind fails', () => {
      db.designSpecificationDetail.batchFind = mockReject('error')

      return target.batchGetDesignSpecificationDetailsByIds([1, 2], testTx).then(() => {}, (err) => {
        expect(db.designSpecificationDetail.batchFind).toHaveBeenCalledWith([1, 2], testTx)
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchCreateDesignSpecificationDetails', () => {
    it('creates design specification details', () => {
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchCreate = mockResolve([{}])
      AppUtil.createPostResponse = mock()

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.designSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchCreate fails', () => {
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchCreate = mockReject('error')

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.designSpecificationDetail.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.designSpecificationDetail.batchCreate = mockReject('error')

      return target.batchCreateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.designSpecificationDetail.batchCreate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('batchUpdateDesignSpecificationDetails', () => {
    it('updates design specification details', () => {
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchUpdate = mockResolve([{}])
      AppUtil.createPutResponse = mock()

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.designSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPutResponse).toHaveBeenCalledWith([{}])
      })
    })

    it('rejects when batchUpdate fails', () => {
      target.validator.validate = mockResolve()
      db.designSpecificationDetail.batchUpdate = mockReject('error')

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.designSpecificationDetail.batchUpdate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.designSpecificationDetail.batchUpdate = mockReject('error')

      return target.batchUpdateDesignSpecificationDetails([{}], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.designSpecificationDetail.batchUpdate).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('manageAllDesignSpecificationDetails', () => {
    it('manages delete, update, and create design specification details call', () => {
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
      }, 1, testContext, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createDesignSpecificationDetails).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).toHaveBeenCalled()
      })
    })

    it('returns nothing when designSpecificationDetailsObj is null', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mock()
      target.updateDesignSpecificationDetails = mock()
      target.createDesignSpecificationDetails = mock()
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails(null, 1, testContext, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.populateExperimentId).not.toHaveBeenCalled()
        expect(target.deleteDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(target.updateDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(target.createDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
      })
    })

    it('rejects when create fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockResolve()
      target.updateDesignSpecificationDetails = mockResolve()
      target.createDesignSpecificationDetails = mockReject('error')
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createDesignSpecificationDetails).toHaveBeenCalledWith([{}, {}], testContext, testTx)
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when update fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockResolve()
      target.updateDesignSpecificationDetails = mockReject('error')
      target.createDesignSpecificationDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(target.createDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when delete fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.populateExperimentId = mockResolve()
      target.deleteDesignSpecificationDetails = mockReject('error')
      target.updateDesignSpecificationDetails = mockResolve()
      target.createDesignSpecificationDetails = mockResolve()
      AppUtil.createCompositePostResponse = mock()

      return target.manageAllDesignSpecificationDetails({
        deletes: [1],
        updates: [{}],
        adds: [{}, {}],
      }, 1, testContext, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, testTx)
        expect(target.populateExperimentId).toHaveBeenCalledTimes(2)
        expect(target.deleteDesignSpecificationDetails).toHaveBeenCalledWith([1], testContext, testTx)
        expect(target.updateDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(target.createDesignSpecificationDetails).not.toHaveBeenCalled()
        expect(AppUtil.createCompositePostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteDesignSpecificationDetails', () => {
    it('deletes design specification details', () => {
      db.designSpecificationDetail.batchRemove = mockResolve([1])
      return target.deleteDesignSpecificationDetails([1], testContext, testTx).then((data) => {
        expect(db.designSpecificationDetail.batchRemove).toHaveBeenCalledWith([1], testTx)
        expect(data).toEqual([1])
      })
    })

    it('resolves when no ids are passed in for delete', () => {
      db.designSpecificationDetail.batchRemove = mock()

      return target.deleteDesignSpecificationDetails([], testContext, testTx).then(() => {
        expect(db.designSpecificationDetail.batchRemove).not.toHaveBeenCalled()
      })
    })

    it('throws an error when not all design specification details are found for delete', () => {
      db.designSpecificationDetail.batchRemove = mockResolve([1])
      AppError.notFound = mock()

      return target.deleteDesignSpecificationDetails([1, 2], testContext, testTx).then(() => {}, () => {
        expect(db.designSpecificationDetail.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Not all design specification detail ids' +
          ' requested for delete were found')
      })
    })
  })

  describe('updateDesignSpecificationDetails', () => {
    it('updates design specification details', () => {
      target.batchUpdateDesignSpecificationDetails = mockResolve([{}])

      return target.updateDesignSpecificationDetails([{ experimentId: 1 }], testContext, testTx).then((data) => {
        expect(target.batchUpdateDesignSpecificationDetails).toHaveBeenCalledWith([{ experimentId: 1 }], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('does not update design specification details when none are passed in', () => {
      target.batchUpdateUnitSpecificationDetails = mock()

      return target.updateDesignSpecificationDetails([], testTx).then(() => {
        expect(target.batchUpdateUnitSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })

  describe('createDesignSpecificationDetails', () => {
    it('creates design specification details', () => {
      target.batchCreateDesignSpecificationDetails = mockResolve([{}])

      return target.createDesignSpecificationDetails([{ experimentId: 1 }], testContext, testTx).then((data) => {
        expect(target.batchCreateDesignSpecificationDetails).toHaveBeenCalledWith([{ experimentId: 1 }], testContext, testTx)
        expect(data).toEqual([{}])
      })
    })

    it('does not create design specification details', () => {
      target.batchCreateDesignSpecificationDetails = mock()

      return target.createDesignSpecificationDetails([], testContext, testTx).then(() => {
        expect(target.batchCreateDesignSpecificationDetails).not.toHaveBeenCalled()
      })
    })
  })

  describe('populateExperimentId', () => {
    it('populates experimentId in design specification detail objects', () => {
      const data = [{ id: 1, refDesignSpecId: 1, value: 10 }]
      target.populateExperimentId(data, 1)
      expect(data).toEqual([{ id: 1, refDesignSpecId: 1, value: 10, experimentId: 1 }])

    })

  })

})
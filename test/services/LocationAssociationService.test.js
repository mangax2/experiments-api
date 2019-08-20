import { mock, mockResolve } from '../jestUtil'
import LocationAssociationService from '../../src/services/LocationAssociationService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('LocationAssociationService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  beforeEach(() => {
    expect.hasAssertions()
    target = new LocationAssociationService()
  })

  describe('associateSetsToLocations', () => {
    test('rejects when passed in group id has invalid location value', () => {
      const groups = [{ id: '1' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to determine location from group id', null, '1Y1001')
      })
    })

    test('rejects when experiment id from group id does not match the routes id', () => {
      const groups = [{ id: '1.2' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 2 }])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})

      return target.associateSetsToLocations(2, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment Id from Group Id does not match Experiment Id on route', null, '1Y1003')
      })
    })

    test('rejects when passed in group id has location value that is not a number', () => {
      const groups = [{ id: '1.abc' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to determine location from group id', null, '1Y1001')
      })
    })

    test('rejects when at least one passed in group id has a location that the experiment does not have', () => {
      const groups = [{ id: '1.1' }, { id: '1.9' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Location does not match valid locations for this experiment', null, '1Y1002')
      })
    })

    test('rejects when a block is passed in but there are no blocks defined', () => {
      const groups = [{ id: '1.1.2' }, { id: '1.9' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 1 }])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid block value passed for association', null, '1Y1005')
      })
    })

    test('rejects when an invalid block is passed in for blocking', () => {
      const groups = [{ id: '1.1.2' }, { id: '1.9.1' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1, block: 4 }, { location: 1 }])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid block value passed for association', null, '1Y1004')
      })
    })

    test('calls to persist location, set, experiment associations', () => {
      const groups = [{ id: '1.1', setId: 123 }, { id: '1.2', setId: 456 }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})
      db.locationAssociation = {
        batchCreate: mockResolve(),
        batchRemoveByExperimentIdAndLocationAndBlock: mockResolve(),
      }

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(() => {
        expect(db.locationAssociation.batchCreate).toHaveBeenCalledWith([
          {
            experimentId: 1,
            location: 1,
            setId: 123,
            block: null,
          },
          {
            experimentId: 1,
            location: 2,
            setId: 456,
            block: null,
          },
        ], testContext, testTx)
      })
    })

    test('calls to persist location, set, experiment, block associations', () => {
      const groups = [{ id: '1.1.1', setId: 123 }, { id: '1.2.2', setId: 456 }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1, block: 1 }, { location: 2, block: 2 }])
      target.experimentService.rejectIfExperimentDoesNotExist = mockResolve({})
      db.locationAssociation = {
        batchCreate: mockResolve(),
        batchRemoveByExperimentIdAndLocationAndBlock: mockResolve(),
      }

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(() => {
        expect(db.locationAssociation.batchCreate).toHaveBeenCalledWith([
          {
            experimentId: 1,
            location: 1,
            setId: 123,
            block: 1,
          },
          {
            experimentId: 1,
            location: 2,
            setId: 456,
            block: 2,
          },
        ], testContext, testTx)
      })
    })
  })

  describe('getLocationAssociationByExperimentId', () => {
    test('locationAssociation repo should be called', () => {
      db.locationAssociation.findByExperimentId = mockResolve({})
      return target.getLocationAssociationByExperimentId(3, testTx).then(() => {
        expect(db.locationAssociation.findByExperimentId).toHaveBeenCalledWith(3, testTx)
      })
    })
  })
})

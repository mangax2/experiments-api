import { mock, mockResolve } from '../jestUtil'
import LocationAssociationService from '../../src/services/LocationAssociationService'
import AppError from '../../src/services/utility/AppError'
import { dbRead, dbWrite } from '../../src/db/DbManager'

describe('LocationAssociationService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  beforeEach(() => {
    target = new LocationAssociationService()

    dbRead.block.findByExperimentId = mockResolve([
      { id: 1, name: null },
      { id: 2, name: '1' },
      { id: 3, name: '2' },
      { id: 4, name: 'Test 2.5' },
      { id: 5, name: 'block 001' },
    ])
    dbRead.locationAssociation.findByExperimentId = mockResolve([{ block_id: 5, location: 1, set_id: 10220 }])
  })

  describe('associateSetsToLocations', () => {
    test('rejects when passed in group id has invalid location value', async () => {
      const groups = [{ id: '1' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])
      target.experimentService.verifyExperimentExists = mockResolve({})

      try {
        await target.associateSetsToLocations(1, groups, testContext, testTx)
      } catch (err) {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to determine location from group id', null, '1Y1001')
      }
    })

    test('rejects when experiment id from group id does not match the routes id', async () => {
      const groups = [{ id: '1.2' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})

      try {
        await target.associateSetsToLocations(2, groups, testContext, testTx)
      } catch (err) {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment Id from Group Id does not match Experiment Id on route', null, '1Y1003')
      }
    })

    test('rejects when passed in group id has location value that is not a number', async () => {
      const groups = [{ id: '1.abc' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])
      target.experimentService.verifyExperimentExists = mockResolve({})

      try {
        await target.associateSetsToLocations(1, groups, testContext, testTx)
      } catch (err) {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to determine location from group id', null, '1Y1001')
      }
    })

    test('rejects when at least one passed in group id has a location that the experiment does not have', async () => {
      const groups = [{ id: '1.1' }, { id: '1.9' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})

      try {
        await target.associateSetsToLocations(1, groups, testContext, testTx)
      } catch (err) {
        expect(AppError.badRequest).toHaveBeenCalledWith('Location does not match valid locations for this experiment', null, '1Y1002')
      }
    })

    test('rejects when an invalid block is passed in for blocking', async () => {
      const groups = [{ id: '1.1.4' }, { id: '1.9.1' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 1 }])
      target.experimentService.verifyExperimentExists = mockResolve({})

      try {
        await target.associateSetsToLocations(1, groups, testContext, testTx)
      } catch (err) {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid block value passed for association', null, '1Y1004')
      }
    })

    test('rejects when the request has a set association for a location/block that already has a set', async () => {
      const groups = [{ id: '1.1.block 001', setId: 123 }, { id: '1.2.block 001', setId: 456 }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 1 }])
      target.experimentService.verifyExperimentExists = mockResolve({})

      try {
        await target.associateSetsToLocations(1, groups, testContext, testTx)
      } catch (err) {
        expect(AppError.badRequest).toHaveBeenCalledWith('A set already exists for the location and block combination', null, '1Y1005')
      }
    })

    test('calls to persist location, set, experiment associations', async () => {
      const groups = [{ id: '1.1', setId: 123 }, { id: '1.2', setId: 456 }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})
      dbWrite.locationAssociation.batchCreate = mockResolve()


      await target.associateSetsToLocations(1, groups, testContext, testTx)

      expect(dbWrite.locationAssociation.batchCreate).toHaveBeenCalledWith([
        {
          location: 1,
          setId: 123,
          block_id: 1,
        },
        {
          location: 2,
          setId: 456,
          block_id: 1,
        },
      ], testContext, testTx)
    })

    test('calls to persist location, set, experiment, block associations', async () => {
      const groups = [{ id: '1.1.1', setId: 123 }, { id: '1.2.2', setId: 456 }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})
      dbWrite.locationAssociation.batchCreate = mockResolve()

      await target.associateSetsToLocations(1, groups, testContext, testTx)

      expect(dbWrite.locationAssociation.batchCreate).toHaveBeenCalledWith([
        {
          location: 1,
          setId: 123,
          block_id: 2,
        },
        {
          location: 2,
          setId: 456,
          block_id: 3,
        },
      ], testContext, testTx)
    })

    test('handles blocks with a period in the name', async () => {
      const groups = [{ id: '1.1.Test 2.5', setId: 123 }, { id: '1.2.2', setId: 456 }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})
      dbWrite.locationAssociation.batchCreate = mockResolve()

      await target.associateSetsToLocations(1, groups, testContext, testTx)

      expect(dbWrite.locationAssociation.batchCreate).toHaveBeenCalledWith([
        {
          location: 1,
          setId: 123,
          block_id: 4,
        },
        {
          location: 2,
          setId: 456,
          block_id: 3,
        },
      ], testContext, testTx)
    })
  })
})

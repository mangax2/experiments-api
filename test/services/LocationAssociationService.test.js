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
    test('rejects when at least one passed in group id has a location that the experiment does not have', async () => {
      const groups = [
        { blockId: 1, location: 1, setId: 1 },
        { blockId: 1, location: 9, setId: 2 },
      ]
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
      const groups = [
        { blockId: 1, location: 1, setId: 1 },
        { blockId: 10, location: 1, setId: 2 },
      ]
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
      const groups = [
        { blockId: 1, location: 1, setId: 123 },
        { blockId: 5, location: 1, setId: 456 },
      ]
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
      const groups = [
        { blockId: 1, location: 1, setId: 123 },
        { blockId: 1, location: 2, setId: 456 },
      ]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})
      dbWrite.locationAssociation.batchCreate = mockResolve()

      await target.associateSetsToLocations(1, groups, testContext, testTx)

      expect(dbWrite.locationAssociation.batchCreate).toHaveBeenCalledWith([
        {
          location: 1,
          setId: 123,
          blockId: 1,
        },
        {
          location: 2,
          setId: 456,
          blockId: 1,
        },
      ], testContext, testTx)
    })

    test('calls to persist location, set, experiment, block associations', async () => {
      const groups = [
        { blockId: 2, location: 1, setId: 123 },
        { blockId: 3, location: 2, setId: 456 },
      ]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})
      dbWrite.locationAssociation.batchCreate = mockResolve()

      await target.associateSetsToLocations(1, groups, testContext, testTx)

      expect(dbWrite.locationAssociation.batchCreate).toHaveBeenCalledWith([
        {
          location: 1,
          setId: 123,
          blockId: 2,
        },
        {
          location: 2,
          setId: 456,
          blockId: 3,
        },
      ], testContext, testTx)
    })

    test('handles blocks with a period in the name', async () => {
      const groups = [
        { blockId: 4, location: 1, setId: 123 },
        { blockId: 3, location: 2, setId: 456 },
      ]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.verifyExperimentExists = mockResolve({})
      dbWrite.locationAssociation.batchCreate = mockResolve()

      await target.associateSetsToLocations(1, groups, testContext, testTx)

      expect(dbWrite.locationAssociation.batchCreate).toHaveBeenCalledWith([
        {
          location: 1,
          setId: 123,
          blockId: 4,
        },
        {
          location: 2,
          setId: 456,
          blockId: 3,
        },
      ], testContext, testTx)
    })
  })
})

import { mock, mockResolve } from '../jestUtil'
import LocationAssociationService from '../../src/services/LocationAssociationService'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('GroupService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    expect.hasAssertions()
    target = new LocationAssociationService()
  })

  describe('associateSetsToLocations', () => {
    test('rejects when passed in group id has invalid location value', () => {
      const groups = [{ id: '1' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])
      target.experimentService.getExperimentById = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to determine location from group id', null, '1Y1001')
      })
    })

    test('rejects when passed in group id has location value that is not a number', () => {
      const groups = [{ id: '1.abc' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([])
      target.experimentService.getExperimentById = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to determine location from group id', null, '1Y1001')
      })
    })

    test('rejects when at least one passed in group id has a location that the experiment does not have', () => {
      const groups = [{ id: '1.1' }, { id: '1.9' }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.getExperimentById = mockResolve({})

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Location does not match valid locations for this experiment', null, '1Y1002')
      })
    })

    test('calls to persist location, set, experiment associations', () => {
      const groups = [{ id: '1.1', setId: 123 }, { id: '1.2', setId: 456 }]
      AppError.badRequest = mock()
      target.experimentalUnitService.getExperimentalUnitsByExperimentIdNoValidate = mockResolve([{ location: 1 }, { location: 2 }])
      target.experimentService.getExperimentById = mockResolve({})
      db.locationAssociation = {
        batchCreate: mockResolve(),
      }

      return target.associateSetsToLocations(1, groups, testContext, testTx).then(() => {
        expect(db.locationAssociation.batchCreate).toHaveBeenCalledWith([
          {
            experimentId: 1,
            location: 1,
            setId: 123,
          },
          {
            experimentId: 1,
            location: 2,
            setId: 456,
          },
        ], testContext, testTx)
      })
    })
  })
})

import { mock, mockResolve } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import { dbRead, dbWrite } from '../../src/db/DbManager'
import FactorLevelAssociationService from '../../src/services/FactorLevelAssociationService'

describe('FactorLevelAssociationService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new FactorLevelAssociationService()
  })

  describe('getFactorLevelAssociationByExperimentId', () => {
    test('returns all factor level associations', () => {
      dbRead.factorLevelAssociation.findByExperimentId = mockResolve([{}])

      return FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(1).then((data) => {
        expect(dbRead.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([{}])
      })
    })
  })

  describe('batchDeleteFactorLevelAssociations', () => {
    test('calls factorLevelAssociation batchRemove and returns data', () => {
      dbWrite.factorLevelAssociation.batchRemove = mockResolve([1, 2])

      return FactorLevelAssociationService.batchDeleteFactorLevelAssociations([1, 2], testTx).then((data) => {
        expect(dbWrite.factorLevelAssociation.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })
  })

  describe('batchCreateFactorLevelAssociations', () => {
    test('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      dbWrite.factorLevelAssociation.batchCreate = mockResolve([])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevelAssociations([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST')
        expect(dbWrite.factorLevelAssociation.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([])
      })
    })
  })
})

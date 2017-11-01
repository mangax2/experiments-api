import { mock, mockResolve } from '../jestUtil'
import AppUtil from '../../src/services/utility/AppUtil'
import db from '../../src/db/DbManager'
import FactorLevelAssociationService from '../../src/services/FactorLevelAssociationService'

describe('FactorLevelAssociationService', () => {
  let target
  const testContext = {}
  const testTx = {tx: {}}

  beforeEach(() => {
    target = new FactorLevelAssociationService()
  })

  describe('getFactorLevelAssociationByExperimentId', () => {
    it('returns all factor level associations', () => {
      db.factorLevelAssociation.findByExperimentId = mockResolve([{}])

      return FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(1, testTx).then((data) => {
        expect(db.factorLevelAssociation.findByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([{}])
      })
    })
  })

  describe('batchDeleteFactorLevelAssociations', () => {
    it('calls factorLevelAssociation batchRemove and returns data', () => {
      db.factorLevelAssociation.batchRemove = mockResolve([1, 2])

      return FactorLevelAssociationService.batchDeleteFactorLevelAssociations([1, 2], testTx).then((data) => {
        expect(db.factorLevelAssociation.batchRemove).toHaveBeenCalledWith([1, 2], testTx)
        expect(data).toEqual([1, 2])
      })
    })
  })

  describe('batchCreateFactorLevelAssociations', () => {
    it('validates, calls batchCreate, and returns postResponse', () => {
      target.validator.validate = mockResolve()
      db.factorLevelAssociation.batchCreate = mockResolve([])
      AppUtil.createPostResponse = mock()

      return target.batchCreateFactorLevelAssociations([{}], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'POST', testTx)
        expect(db.factorLevelAssociation.batchCreate).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([])
      })
    })
  })
})

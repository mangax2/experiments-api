import { mock } from '../jestUtil'
import ReferentialIntegrityService from '../../src/services/ReferentialIntegrityService'

describe('ReferentialIntegrityService', () => {
  let target
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new ReferentialIntegrityService()
  })

  describe('getById', () => {
    it('calls entity find', () => {
      const entity = { find: mock() }

      target.getById(1, entity, testTx)
      expect(entity.find).toHaveBeenCalledWith(1, testTx)
    })
  })

  describe('getByBusinessKey', () => {
    it('calls findByBusinessKey', () => {
      const entity = { findByBusinessKey: mock() }

      target.getByBusinessKey(['key1', 'key2'], entity, testTx)
      expect(entity.findByBusinessKey).toHaveBeenCalledWith(['key1', 'key2'], testTx)
    })
  })

  describe('getEntitiesByKeys', () => {
    it('gets entities by BusinessKey', () => {
      const entity = { batchFindByBusinessKey: mock() }

      target.getEntitiesByKeys([{}], entity, testTx)
      expect(entity.batchFindByBusinessKey).toHaveBeenCalledWith([{}], testTx)
    })
  })

  describe('getEntitiesByIds', () => {
    it('gets entities by ids', () => {
      const entity = { batchFind: mock() }

      target.getEntitiesByIds([1, 2], entity, testTx)
      expect(entity.batchFind).toHaveBeenCalledWith([1, 2], testTx)
    })
  })
})
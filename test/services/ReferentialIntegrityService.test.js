import { mock } from '../jestUtil'
import ReferentialIntegrityService from '../../src/services/ReferentialIntegrityService'

describe('ReferentialIntegrityService', () => {
  let target

  beforeEach(() => {
    target = new ReferentialIntegrityService()
  })

  describe('getById', () => {
    test('calls entity find', () => {
      const entity = { find: mock() }

      target.getById(1, entity)

      expect(entity.find).toHaveBeenCalledWith(1)
    })
  })

  describe('getByBusinessKey', () => {
    test('calls findByBusinessKey', () => {
      const entity = { findByBusinessKey: mock() }

      target.getByBusinessKey(['key1', 'key2'], entity)

      expect(entity.findByBusinessKey).toHaveBeenCalledWith(['key1', 'key2'])
    })
  })

  describe('getEntitiesByKeys', () => {
    test('gets entities by BusinessKey', () => {
      const entity = { batchFindByBusinessKey: mock() }

      target.getEntitiesByKeys([{}], entity)

      expect(entity.batchFindByBusinessKey).toHaveBeenCalledWith([{}])
    })
  })

  describe('getEntitiesByIds', () => {
    test('gets entities by ids', () => {
      const entity = { batchFind: mock() }

      target.getEntitiesByIds([1, 2], entity)

      expect(entity.batchFind).toHaveBeenCalledWith([1, 2])
    })
  })
})

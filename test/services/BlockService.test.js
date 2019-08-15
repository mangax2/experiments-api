import BlockService from '../../src/services/BlockService'
import db from '../../src/db/DbManager'
import { mockResolve } from '../jestUtil'

describe('BlockService', () => {
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  describe('createBlocksByExperimentId', () => {
    test('create blocks that does not exist yet', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      db.block.findByExperimentId = mockResolve(blocks)
      db.block.batchCreateByExperimentId = mockResolve([])
      const target = new BlockService()
      return target.createBlocksByExperimentId(1, ['block3', 'block3', 'block2'], {}, testTx)
        .then(() => {
          expect(db.block.batchCreateByExperimentId).toHaveBeenCalledWith(1, ['block3'], {}, testTx)
        })
    })

    test('all blocks exist', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      db.block.findByExperimentId = mockResolve(blocks)
      db.block.batchCreateByExperimentId = mockResolve([])
      const target = new BlockService()
      return target.createBlocksByExperimentId(1, ['block1', 'block2'], {}, testTx)
        .then(() => {
          expect(db.block.batchCreateByExperimentId).toHaveBeenCalledWith(1, [], {}, testTx)
        })
    })
  })

  describe('removeBlocksByExperimentId', () => {
    test('remove blocks that are not needed any more', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      db.block.findByExperimentId = mockResolve(blocks)
      db.block.batchRemove = mockResolve([])
      const target = new BlockService()
      return target.removeBlocksByExperimentId(1, ['block2', 'block2'], testTx)
        .then(() => {
          expect(db.block.batchRemove).toHaveBeenCalledWith([11], testTx)
        })
    })

    test('nothing to remove', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      db.block.findByExperimentId = mockResolve(blocks)
      db.block.batchRemove = mockResolve([])
      const target = new BlockService()
      return target.removeBlocksByExperimentId(1, ['block1', 'block2'], testTx)
        .then(() => {
          expect(db.block.batchRemove).toHaveBeenCalledWith([], testTx)
        })
    })
  })
})

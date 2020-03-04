import BlockService from '../../src/services/BlockService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'
import { mockReject, mockResolve, mock } from '../jestUtil'

describe('BlockService', () => {
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  describe('createOnlyNewBlocksByExperimentId', () => {
    test('create blocks that does not exist yet', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      db.block.findByExperimentId = mockResolve(blocks)
      db.block.batchCreateByExperimentId = mockResolve([])
      const target = new BlockService()
      return target.createOnlyNewBlocksByExperimentId(1, ['block3', 'block3', 'block2'], {}, testTx)
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
      return target.createOnlyNewBlocksByExperimentId(1, ['block1', 'block2'], {}, testTx)
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

  describe('renameBlocks', () => {
    test('does not handle errors from the security service', () => {
      const testError = { message: 'test message', status: 500 }
      const target = new BlockService()
      target.securityService = { permissionsCheck: mockReject(testError) }
      db.block.batchUpdate = mockResolve()
      const renamedBlocks = [{ id: 2, name: 'block 2' }]
      const testContext = { userId: 'testUser' }

      return target.renameBlocks(5, false, renamedBlocks, testContext, testTx).catch((err) => {
        expect(err).toBe(testError)
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(5, testContext, false, testTx)
        expect(db.block.batchUpdate).not.toHaveBeenCalledWith()
      })
    })

    test('does not handle errors from the validator', () => {
      const testError = { message: 'test message', status: 500 }
      const target = new BlockService()
      target.securityService = { permissionsCheck: mockResolve() }
      target.validator = { validate: mockReject(testError) }
      db.block.batchUpdate = mockResolve()
      const renamedBlocks = [{ id: 2, name: 'block 2' }]
      const testContext = { userId: 'testUser' }

      return target.renameBlocks(5, false, renamedBlocks, testContext, testTx).catch((err) => {
        expect(err).toBe(testError)
        expect(target.validator.validate).toHaveBeenCalledWith(renamedBlocks, 'PATCH', testTx)
        expect(db.block.batchUpdate).not.toHaveBeenCalledWith()
      })
    })

    test('throws if a block does not belong to the experiment', () => {
      const testError = { message: 'test message', status: 500 }
      const target = new BlockService()
      target.securityService = { permissionsCheck: mockResolve() }
      target.validator = { validate: mockResolve() }
      db.block.findByExperimentId = mockResolve([])
      db.block.batchUpdate = mockResolve()
      const renamedBlocks = [{ id: 2, name: 'block 2' }]
      const testContext = { userId: 'testUser' }
      AppError.badRequest = mock(testError)

      return target.renameBlocks(5, false, renamedBlocks, testContext, testTx).catch((err) => {
        expect(err).toBe(testError)
        expect(AppError.badRequest).toHaveBeenCalledWith('At least one block does not belong to the specified experiment', renamedBlocks, '213001')
        expect(db.block.batchUpdate).not.toHaveBeenCalledWith()
      })
    })

    test('calls block batchUpdate when the call is valid', () => {
      const target = new BlockService()
      target.securityService = { permissionsCheck: mockResolve() }
      target.validator = { validate: mockResolve() }
      db.block.findByExperimentId = mockResolve([{ id: 1 }, { id: 2 }, { id: 3 }])
      db.block.batchUpdate = mockResolve()
      const renamedBlocks = [{ id: 2, name: 'block 2' }]
      const testContext = { userId: 'testUser' }

      return target.renameBlocks(5, false, renamedBlocks, testContext, testTx).then(() => {
        expect(db.block.batchUpdate).toHaveBeenCalledWith(renamedBlocks, testContext, testTx)
      })
    })
  })
})

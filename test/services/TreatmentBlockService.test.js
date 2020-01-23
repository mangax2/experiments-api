import TreatmentBlockService from '../../src/services/TreatmentBlockService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'
import { mock, mockReject, mockResolve } from '../jestUtil'

describe('TreatmentBlockService', () => {
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  describe('getTreatmentBlocksByExperimentId', () => {
    test('there is no block, return empty array', () => {
      db.block.findByExperimentId = mockResolve([])
      const target = new TreatmentBlockService()

      return target.getTreatmentBlocksByExperimentId(1, testTx)
        .then((data) => {
          expect(data).toEqual([])
        })
    })

    test('treatment block should be returned with block info', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      const treatmentBlocks = [
        { id: 1, block_id: 11, treatment_id: 111 },
        { id: 2, block_id: 12, treatment_id: 112 },
      ]
      db.block.findByExperimentId = mockResolve(blocks)
      db.treatmentBlock.batchFindByBlockIds = mockResolve(treatmentBlocks)

      const target = new TreatmentBlockService()
      target.getTreatmentBlocksWithBlockInfo = mockResolve()

      return target.getTreatmentBlocksByExperimentId(1, testTx).then(() => {
        expect(db.treatmentBlock.batchFindByBlockIds).toHaveBeenCalledWith([11, 12], testTx)
        expect(target.getTreatmentBlocksWithBlockInfo).toHaveBeenCalledWith(treatmentBlocks, blocks)
      })
    })
  })

  describe('getTreatmentBlocksBySetId', () => {
    test('set is not associated to an experiment, return []', () => {
      const target = new TreatmentBlockService()
      target.locationAssocWithBlockService.getBySetId = mockResolve(null)

      return target.getTreatmentBlocksBySetId(1, testTx)
        .then((data) => {
          expect(data).toEqual([])
        })
    })

    test('treatment block should be returned with block info', () => {
      const block = { id: 11, name: 'block1' }
      const treatmentBlocks = [
        { id: 1, block_id: 11, treatment_id: 111 },
        { id: 2, block_id: 11, treatment_id: 112 },
      ]

      const locationAssociation = { set_id: 1, block_id: 11 }
      db.block.findByBlockId = mockResolve(block)
      db.treatmentBlock.findByBlockId = mockResolve(treatmentBlocks)

      const target = new TreatmentBlockService()
      target.locationAssocWithBlockService.getBySetId = mockResolve(locationAssociation)
      target.getTreatmentBlocksWithBlockInfo = mockResolve()

      return target.getTreatmentBlocksBySetId(1, testTx).then(() => {
        expect(db.block.findByBlockId).toHaveBeenCalledWith(11, testTx)
        expect(db.treatmentBlock.findByBlockId).toHaveBeenCalledWith(11, testTx)
        expect(target.getTreatmentBlocksWithBlockInfo).toHaveBeenCalledWith(treatmentBlocks, [block])
      })
    })
  })

  describe('getTreatmentBlocksByTreatmentIds', () => {
    test('empty treatmentIds, return []', () => {
      const target = new TreatmentBlockService()

      return target.getTreatmentBlocksByTreatmentIds([], testTx)
        .then((data) => {
          expect(data).toEqual([])
        })
    })

    test('treatment block should be returned with block info', () => {
      const blocks = [{ id: 11, name: 'block1' }]
      const treatmentBlocks = [
        { id: 1, block_id: 11, treatment_id: 111 },
        { id: 2, block_id: 11, treatment_id: 112 },
      ]

      db.block.batchFindByBlockIds = mockResolve(blocks)
      db.treatmentBlock.batchFindByTreatmentIds = mockResolve(treatmentBlocks)

      const target = new TreatmentBlockService()
      target.getTreatmentBlocksWithBlockInfo = mock()

      return target.getTreatmentBlocksByTreatmentIds([111, 112], testTx).then(() => {
        expect(db.block.batchFindByBlockIds).toHaveBeenCalledWith([11], testTx)
        expect(db.treatmentBlock.batchFindByTreatmentIds).toHaveBeenCalledWith([111, 112], testTx)
        expect(target.getTreatmentBlocksWithBlockInfo).toHaveBeenCalledWith(treatmentBlocks, blocks)
      })
    })
  })

  describe('getTreatmentBlocksByIds', () => {
    test('empty ids, return []', () => {
      const target = new TreatmentBlockService()

      return target.getTreatmentBlocksByIds([], testTx)
        .then((data) => {
          expect(data).toEqual([])
        })
    })

    test('treatment block should be returned with block info', () => {
      const blocks = [{ id: 11, name: 'block1' }]
      const treatmentBlocks = [
        { id: 1, block_id: 11, treatment_id: 111 },
        { id: 2, block_id: 11, treatment_id: 112 },
      ]

      db.block.batchFindByBlockIds = mockResolve(blocks)
      db.treatmentBlock.batchFindByIds = mockResolve(treatmentBlocks)

      const target = new TreatmentBlockService()
      target.getTreatmentBlocksWithBlockInfo = mock()

      return target.getTreatmentBlocksByIds([1, 2], testTx).then(() => {
        expect(db.block.batchFindByBlockIds).toHaveBeenCalledWith([11], testTx)
        expect(db.treatmentBlock.batchFindByIds).toHaveBeenCalledWith([1, 2], testTx)
        expect(target.getTreatmentBlocksWithBlockInfo).toHaveBeenCalledWith(treatmentBlocks, blocks)
      })
    })
  })

  describe('getTreatmentBlocksWithBlockInfo', () => {
    test('get the treatment blocks with block info added', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      const treatmentBlocks = [
        { id: 1, block_id: 11, treatment_id: 111 },
        { id: 2, block_id: 11, treatment_id: 112 },
        { id: 2, block_id: 12, treatment_id: 113 },
      ]

      const target = new TreatmentBlockService()
      const result = target.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks)
      expect(result).toEqual([
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 11, treatment_id: 112, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 113, name: 'block2',
        },
      ])
    })
  })

  describe('createTreatmentBlocksByExperimentId', () => {
    test('get blocks for an experiment and call createTreatmentBlocks', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      db.block.findByExperimentId = mockResolve(blocks)
      const target = new TreatmentBlockService()
      target.createTreatmentBlocks = mockResolve()

      return target.createTreatmentBlocksByExperimentId(1, [], {}, testTx)
        .then(() => {
          expect(db.block.findByExperimentId).toHaveBeenCalledWith(1, testTx)
          expect(target.createTreatmentBlocks).toHaveBeenCalledWith([], blocks, {}, testTx)
        })
    })
  })

  describe('createTreatmentBlocks', () => {
    const treatments = [{ id: 3, blocks: [{ name: 'blah', numPerRep: 1 }] }]
    const blocks = [{ id: 5, name: 'blah' }]
    const treatmentBlocks = [{
      name: 'blah', treatmentId: 3, blockId: 5, numPerRep: 1,
    }]


    test('returns an empty array when given no treatments', async () => {
      const target = new TreatmentBlockService()

      const result = await target.createTreatmentBlocks([], blocks, {}, testTx)

      expect(result).toEqual([])
    })

    test('returns an empty array when given no blocks', async () => {
      const target = new TreatmentBlockService()

      const result = await target.createTreatmentBlocks(treatments, [], {}, testTx)

      expect(result).toEqual([])
    })

    test('uses the blocks and treatments to generate treatmentBlocks', async () => {
      const target = new TreatmentBlockService()
      target.createTreatmentBlockModels = mock(treatmentBlocks)
      db.treatmentBlock.batchCreate = mockResolve()

      await target.createTreatmentBlocks(treatments, blocks, {}, testTx)

      expect(target.createTreatmentBlockModels).toHaveBeenCalledWith(treatments, blocks)
    })

    test('returns the treatment blocks that are generated', async () => {
      const target = new TreatmentBlockService()
      target.createTreatmentBlockModels = mock(treatmentBlocks)
      db.treatmentBlock.batchCreate = mockResolve(treatmentBlocks)

      const result = await target.createTreatmentBlocks(treatments, blocks, {}, testTx)

      expect(db.treatmentBlock.batchCreate).toHaveBeenCalledWith(treatmentBlocks, {}, testTx)
      expect(result).toBe(treatmentBlocks)
    })
  })

  describe('handleTreatmentBlocksForExistingTreatments', () => {
    const treatments = [{ id: 3 }, { id: 7 }]
    const creates = [{}, {}]
    const updates = [{}]
    const deletes = [{ id: 1 }]
    const createMockedDb = () => ({
      block: { findByExperimentId: mockResolve() },
      treatmentBlock: {
        batchFindByTreatmentIds: mockResolve(),
        batchCreate: mockResolve(),
        batchRemove: mockResolve(),
        batchUpdate: mockResolve(),
      },
    })

    test('gets the existing blocks and treatmentBlocks from the database', async () => {
      const mockedDb = createMockedDb()
      const target = new TreatmentBlockService({}, {}, mockedDb)
      target.createTreatmentBlockModels = mock()
      target.splitTreatmentBlocksToActions = mock({})

      await target.handleTreatmentBlocksForExistingTreatments(5, treatments, {}, testTx)

      expect(mockedDb.block.findByExperimentId).toHaveBeenCalledWith(5, testTx)
      expect(mockedDb.treatmentBlock.batchFindByTreatmentIds).toHaveBeenCalledWith([3, 7], testTx)
    })

    test('calls the treatment block repo to add, update, and delete', async () => {
      const mockedDb = createMockedDb()
      const target = new TreatmentBlockService({}, {}, mockedDb)
      target.createTreatmentBlockModels = mock()
      target.splitTreatmentBlocksToActions = mock({
        creates,
        updates,
        deletes,
      })

      await target.handleTreatmentBlocksForExistingTreatments(5, treatments, {}, testTx)

      expect(mockedDb.treatmentBlock.batchCreate).toHaveBeenCalledWith(creates, {}, testTx)
      expect(mockedDb.treatmentBlock.batchRemove).toHaveBeenCalledWith([1], testTx)
      expect(mockedDb.treatmentBlock.batchUpdate).toHaveBeenCalledWith(updates, {}, testTx)
    })

    test('does not call the treatment block repo to add, update, and delete if retrieving treatmentBlocks fails', async () => {
      const mockedDb = createMockedDb()
      mockedDb.treatmentBlock.batchFindByTreatmentIds = mockReject()
      const target = new TreatmentBlockService({}, {}, mockedDb)
      target.createTreatmentBlockModels = mock()
      target.splitTreatmentBlocksToActions = mock({
        creates,
        updates,
        deletes,
      })

      try {
        await target.handleTreatmentBlocksForExistingTreatments(5, treatments, {}, testTx)
      } catch {
        // no-op
      } finally {
        expect(mockedDb.treatmentBlock.batchCreate).not.toHaveBeenCalled()
        expect(mockedDb.treatmentBlock.batchRemove).not.toHaveBeenCalled()
        expect(mockedDb.treatmentBlock.batchUpdate).not.toHaveBeenCalled()
      }
    })
  })

  describe('createTreatmentBlockModels', () => {
    test('flattens the blocks from all treatments and matches block names to ids', () => {
      const target = new TreatmentBlockService()
      const treatments = [
        { id: 3, blocks: [{ name: 'second', numPerRep: 1 }, { name: 'first', numPerRep: 2 }] },
        { id: 5, blocks: [{ name: 'second', numPerRep: 1 }] },
      ]
      const blocks = [
        { name: 'first', id: 11 },
        { name: 'second', id: 25 },
      ]

      const result = target.createTreatmentBlockModels(treatments, blocks)

      expect(result).toEqual([
        { blockId: 25, treatmentId: 3, numPerRep: 1 },
        { blockId: 11, treatmentId: 3, numPerRep: 2 },
        { blockId: 25, treatmentId: 5, numPerRep: 1 },
      ])
    })
  })

  describe('splitTreatmentBlocksToActions', () => {
    test('makes all request treatment blocks creates when nothing comes from database', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 5, numPerRep: 1 },
        { blockId: 3, treatmentId: 7, numPerRep: 1 },
      ]

      const result = target.splitTreatmentBlocksToActions(requestTbs, [])

      expect(result.creates).toEqual(requestTbs)
      expect(result.updates).toEqual([])
      expect(result.deletes).toEqual([])
    })

    test('makes all database treatment blocks deletes when nothing comes from request', () => {
      const target = new TreatmentBlockService()
      const databaseTbs = [{
        id: 9, block_id: 3, treatment_id: 5, num_per_rep: 1,
      }, {
        id: 11, block_id: 3, treatment_id: 7, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions([], databaseTbs)

      expect(result.creates).toEqual([])
      expect(result.updates).toEqual([])
      expect(result.deletes).toEqual(databaseTbs)
    })

    test('has no changes when request and database match', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 5, numPerRep: 1 },
        { blockId: 3, treatmentId: 7, numPerRep: 1 },
      ]
      const databaseTbs = [{
        id: 9, block_id: 3, treatment_id: 5, num_per_rep: 1,
      }, {
        id: 11, block_id: 3, treatment_id: 7, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions(requestTbs, databaseTbs)

      expect(result.creates).toEqual([])
      expect(result.updates).toEqual([])
      expect(result.deletes).toEqual([])
    })

    test('finds updates when the treatment block is an exact match, but the numPerRep has changed', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 5, numPerRep: 1 },
        { blockId: 3, treatmentId: 7, numPerRep: 2 },
      ]
      const databaseTbs = [{
        id: 9, block_id: 3, treatment_id: 5, num_per_rep: 1,
      }, {
        id: 11, block_id: 3, treatment_id: 7, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions(requestTbs, databaseTbs)

      expect(result.creates).toEqual([])
      expect(result.updates).toEqual([requestTbs[1]])
      expect(result.deletes).toEqual([])
    })

    test('can combine adds and updates', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 5, numPerRep: 1 },
        { blockId: 3, treatmentId: 7, numPerRep: 2 },
      ]
      const databaseTbs = [{
        id: 11, block_id: 3, treatment_id: 7, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions(requestTbs, databaseTbs)

      expect(result.creates).toEqual([requestTbs[0]])
      expect(result.updates).toEqual([requestTbs[1]])
      expect(result.deletes).toEqual([])
    })

    test('can combine adds and deletes', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 5, numPerRep: 1 },
      ]
      const databaseTbs = [{
        id: 11, block_id: 3, treatment_id: 7, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions(requestTbs, databaseTbs)

      expect(result.creates).toEqual([requestTbs[0]])
      expect(result.updates).toEqual([])
      expect(result.deletes).toEqual([databaseTbs[0]])
    })

    test('can combine updates and deletes', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 7, numPerRep: 2 },
      ]
      const databaseTbs = [{
        id: 9, block_id: 3, treatment_id: 5, num_per_rep: 1,
      }, {
        id: 11, block_id: 3, treatment_id: 7, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions(requestTbs, databaseTbs)

      expect(result.creates).toEqual([])
      expect(result.updates).toEqual([requestTbs[0]])
      expect(result.deletes).toEqual([databaseTbs[0]])
    })

    test('does an update if a block is being "swapped" for a treatment block', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 7, numPerRep: 1 },
      ]
      const databaseTbs = [{
        id: 11, block_id: 4, treatment_id: 7, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions(requestTbs, databaseTbs)

      expect(result.creates).toEqual([])
      expect(result.updates).toEqual([requestTbs[0]])
      expect(result.deletes).toEqual([])
    })

    test('does not use an id twice when "swapping"', () => {
      const target = new TreatmentBlockService()
      const requestTbs = [
        { blockId: 3, treatmentId: 5, numPerRep: 1 },
        { blockId: 4, treatmentId: 5, numPerRep: 1 },
      ]
      const databaseTbs = [{
        id: 9, block_id: 5, treatment_id: 5, num_per_rep: 1,
      }, {
        id: 11, block_id: 6, treatment_id: 5, num_per_rep: 1,
      }]

      const result = target.splitTreatmentBlocksToActions(requestTbs, databaseTbs)

      expect(result.creates).toEqual([])
      expect(result.updates).toEqual([requestTbs[0], requestTbs[1]])
      expect(result.deletes).toEqual([])
      expect(requestTbs[0].id).toBe(9)
      expect(requestTbs[1].id).toBe(11)
    })
  })

  describe('getTreatmentDetailsBySetId', () => {
    test('throws an error when a setId is not supplied', () => {
      const target = new TreatmentBlockService()
      target.getTreatmentBlocksBySetId = mock()
      AppError.badRequest = mock('')

      expect(() => target.getTreatmentDetailsBySetId(undefined, testTx)).toThrow()
    })

    test('calls batchFindAllBySetId and batchFindAllTreatmentLevelDetails and mapTreatmentLevelsToOutputFormat', () => {
      const target = new TreatmentBlockService()
      target.getTreatmentBlocksBySetId = mockResolve([{ treatment_id: 1 }, { treatment_id: 2 }])

      const treatmentLevelDetails = [
        {
          treatment_id: 1,
          value: { id: 1 },
        },
        {
          treatment_id: 1,
          value: { id: 2 },
        },
        {
          treatment_id: 2,
          value: { id: 3 },
        },
        {
          treatment_id: 2,
          value: { id: 4 },
        },
      ]
      db.treatment.batchFindAllTreatmentLevelDetails = mockResolve(treatmentLevelDetails)

      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => {
        expect(target.getTreatmentBlocksBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).toHaveBeenCalledWith([1, 2], testTx)
        expect(target.mapTreatmentLevelsToOutputFormat).toHaveBeenCalledWith(treatmentLevelDetails)
      })
    })

    test('rejects when batchFindAllBySetId fails', () => {
      const target = new TreatmentBlockService()
      const error = { message: 'error' }
      target.getTreatmentBlocksBySetId = mockReject(error)

      db.treatment.batchFindAllTreatmentLevelDetails = mock()

      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => { }, (err) => {
        expect(err).toEqual(error)
        expect(target.getTreatmentBlocksBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).not.toHaveBeenCalled()
        expect(target.mapTreatmentLevelsToOutputFormat).not.toHaveBeenCalled()
      })
    })

    test('rejects when batchFindAllTreatmentLevelDetails fails', () => {
      const target = new TreatmentBlockService()
      target.getTreatmentBlocksBySetId = mockResolve([{ treatment_id: 1 }, { treatment_id: 2 }])

      db.treatment.batchFindAllTreatmentLevelDetails = mockReject('error')

      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => { }, () => {
        expect(target.getTreatmentBlocksBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).toHaveBeenCalledWith([1, 2], testTx)
        expect(target.mapTreatmentLevelsToOutputFormat).not.toHaveBeenCalled()
      })
    })

    test('throws an error when no treatments are found', () => {
      const target = new TreatmentBlockService()
      target.getTreatmentBlocksBySetId = mockResolve([])

      db.treatment.batchFindAllTreatmentLevelDetails = mock()
      AppError.notFound = mock('')

      target.mapTreatmentLevelsToOutputFormat = mock()

      return target.getTreatmentDetailsBySetId(1, testTx).then(() => { }, () => {
        expect(target.getTreatmentBlocksBySetId).toHaveBeenCalledWith(1, testTx)
        expect(db.treatment.batchFindAllTreatmentLevelDetails).not.toHaveBeenCalled()
        expect(target.mapTreatmentLevelsToOutputFormat).not.toHaveBeenCalled()
        expect(AppError.notFound).toHaveBeenCalled()
      })
    })
  })

  describe('mapTreatmentLevelsToOutputFormat', () => {
    test('adds levels to the treatmentLevelsMap in the correct places', () => {
      const data = [
        {
          treatment_id: 1,
          name: '1',
          value: { items: [{ id: 1 }] },
        },
        {
          treatment_id: 1,
          name: '2',
          value: { items: [{ id: 2 }] },
        },
        {
          treatment_id: 2,
          name: '3',
          value: { items: [{ id: 3 }] },
        },
        {
          treatment_id: 2,
          name: '4',
          value: { items: [{ id: 4 }] },
        },
      ]

      const target = new TreatmentBlockService()

      expect(target.mapTreatmentLevelsToOutputFormat(data)).toEqual([
        {
          treatmentId: 1,
          factorLevels: [
            {
              factorName: '1',
              items: [{ id: 1 }],
            },
            {
              factorName: '2',
              items: [{ id: 2 }],
            },
          ],
        },
        {
          treatmentId: 2,
          factorLevels: [
            {
              factorName: '3',
              items: [{ id: 3 }],
            },
            {
              factorName: '4',
              items: [{ id: 4 }],
            },
          ],
        },
      ])
    })
  })
})

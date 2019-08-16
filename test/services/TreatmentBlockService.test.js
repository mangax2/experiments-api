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

  describe('getTreatmentBlocksWithBlockInfo', () => {
    test('get the treatment blocks with null block when the matching block is not found', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]
      const treatmentBlocks = [
        { id: 1, block_id: 13, treatment_id: 111 },
      ]

      const target = new TreatmentBlockService()
      const result = target.getTreatmentBlocksWithBlockInfo(treatmentBlocks, blocks)
      expect(result).toEqual([
        {
          id: 1, block_id: 13, treatment_id: 111, name: null,
        },
      ])
    })

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
    test('empty treatment, return with []', () => {
      const target = new TreatmentBlockService()
      return target.createTreatmentBlocks(1, [], {}, testTx).then((data) => {
        expect(data).toEqual([])
      })
    })

    test('treatment blocks are created from treatments', () => {
      const blocks = [
        { id: 11, name: 'block1' },
        { id: 12, name: 'block2' },
      ]

      const oneBlockTM = [{
        treatmentId: 111, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
      }]
      const allBlockTM = [{
        treatmentId: 112, treatmentNumber: 2, block: null, inAllBlocks: true,
      }]
      const treatments = oneBlockTM.concat(allBlockTM)
      const oneBlockTB = [{ blockId: 11, treatmentId: 111, name: 'block1' }]
      const allBlockTB = [
        {
          blockId: 11, treatmentId: 112, name: 'block1',
        },
        {
          blockId: 12, treatmentId: 112, name: 'block2',
        },
      ]

      db.treatmentBlock.batchCreate = mockResolve([])
      const target = new TreatmentBlockService()
      target.assembleNewTreatmentBlocks = mock(oneBlockTB)
      target.assembleNewInAllTreatmentBlocks = mock(allBlockTB)
      return target.createTreatmentBlocks(treatments, blocks, {}, testTx).then(() => {
        expect(target.assembleNewTreatmentBlocks).toHaveBeenCalledWith(oneBlockTM, blocks)
        expect(target.assembleNewInAllTreatmentBlocks).toHaveBeenCalledWith(allBlockTM, blocks)
        expect(db.treatmentBlock.batchCreate).toHaveBeenCalledWith(oneBlockTB.concat(allBlockTB), {}, testTx)
      })
    })
  })

  describe('handleTreatmentBlocksForExistingTreatments', () => {
    test('remove treatment blocks that is not applicable any more, mainly when inAllBlocks in a treatment turns false', () => {
      const tbsInDB = [
        {
          id: 1, block_id: 11, treatment_id: 112,
        },
        {
          id: 2, block_id: 12, treatment_id: 112,
        },
        {
          id: 3, block_id: 13, treatment_id: 112,
        },
      ]
      db.block.findByExperimentId = mockResolve([])
      db.treatmentBlock.batchFindByTreatmentIds = mockResolve(tbsInDB)
      db.treatmentBlock.batchRemove = mockResolve([{ id: 1 }, { id: 2 }])
      db.treatmentBlock.batchCreate = mockResolve([])

      const target = new TreatmentBlockService()
      target.findTBByTreatmentId = mock({})
      target.getTBsToRemoveForExistingTreatments = mock([1, 2])
      target.getNewTBsForExistingTreatments = mock([])
      target.batchUpdateOneBlockTreatmentBlocks = mockResolve([])
      target.createTreatmentBlocks = mockResolve([])

      return target.handleTreatmentBlocksForExistingTreatments(1, [], {}, testTx).then(() => {
        expect(db.treatmentBlock.batchRemove).toHaveBeenCalledWith([1, 2])
        expect(target.batchUpdateOneBlockTreatmentBlocks).toHaveBeenCalledWith([],
          [{ id: 3, block_id: 13, treatment_id: 112 }], [], {}, testTx)
        expect(db.treatmentBlock.batchCreate).toHaveBeenCalledWith([], {}, testTx)
        expect(target.createTreatmentBlocks).toHaveBeenCalledWith([], [], {}, testTx)
      })
    })

    test('add treatment blocks, mainly when inAllBlocks in a treatment turns true', () => {
      const tbsInDB = [
        {
          id: 1, block_id: 11, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          treatmentId: 112, treatmentNumber: 1, block: null, inAllBlocks: true,
        },
      ]
      db.block.findByExperimentId = mockResolve([])
      db.treatmentBlock.batchFindByTreatmentIds = mockResolve(tbsInDB)
      db.treatmentBlock.batchRemove = mockResolve([])
      db.treatmentBlock.batchCreate = mockResolve([])

      const target = new TreatmentBlockService()
      target.findTBByTreatmentId = mock(null)
      target.getTBsToRemoveForExistingTreatments = mock([])
      target.getNewTBsForExistingTreatments = mock([])
      target.batchUpdateOneBlockTreatmentBlocks = mockResolve([])
      target.createTreatmentBlocks = mockResolve([])

      return target.handleTreatmentBlocksForExistingTreatments(1, treatments, {}, testTx).then(() => {
        expect(db.treatmentBlock.batchRemove).toHaveBeenCalledWith([])
        expect(target.batchUpdateOneBlockTreatmentBlocks).toHaveBeenCalledWith([], tbsInDB, [], {}, testTx)
        expect(db.treatmentBlock.batchCreate).toHaveBeenCalledWith([], {}, testTx)
        expect(target.createTreatmentBlocks).toHaveBeenCalledWith(treatments, [], {}, testTx)
      })
    })

    test('update an existing treatment block when the treatment block info has changed', () => {
      const tbsInDB = [
        {
          id: 1, block_id: 11, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          treatmentId: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]
      db.block.findByExperimentId = mockResolve([])
      db.treatmentBlock.batchFindByTreatmentIds = mockResolve(tbsInDB)
      db.treatmentBlock.batchRemove = mockResolve([])
      db.treatmentBlock.batchCreate = mockResolve([])

      const target = new TreatmentBlockService()
      target.findTBByTreatmentId = mock({})
      target.getTBsToRemoveForExistingTreatments = mock([])
      target.getNewTBsForExistingTreatments = mock([])
      target.batchUpdateOneBlockTreatmentBlocks = mockResolve([])
      target.createTreatmentBlocks = mockResolve([])

      return target.handleTreatmentBlocksForExistingTreatments(1, treatments, {}, testTx).then(() => {
        expect(db.treatmentBlock.batchRemove).toHaveBeenCalledWith([])
        expect(target.batchUpdateOneBlockTreatmentBlocks).toHaveBeenCalledWith(treatments, tbsInDB, [], {}, testTx)
        expect(db.treatmentBlock.batchCreate).toHaveBeenCalledWith([], {}, testTx)
        expect(target.createTreatmentBlocks).toHaveBeenCalledWith([], [], {}, testTx)
      })
    })
  })

  describe('getTBsToRemoveForExistingTreatments', () => {
    test('one block and inAllBlocks treatments are counted for treatment block removal', () => {
      const oneBlockTB = [{ id: 1, blockId: 11, treatmentId: 111 }]
      const allBlockTB = [
        {
          id: 2, blockId: 11, treatmentId: 112,
        },
        {
          id: 3, blockId: 12, treatmentId: 112,
        },
      ]

      const target = new TreatmentBlockService()
      target.getTBsToRemoveForOneBlockTreatments = mock(oneBlockTB)
      target.getTBsToRemoveForAllBlockTreatments = mock(allBlockTB)
      expect(target.getTBsToRemoveForExistingTreatments()).toEqual([1, 2, 3])
    })
  })

  describe('getTBsToRemoveForOneBlockTreatments', () => {
    test('returns [] when all treatments are inAllBlocks', () => {
      const existingTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: null, inAllBlocks: true,
        },
      ]

      const target = new TreatmentBlockService()
      expect(target.getTBsToRemoveForOneBlockTreatments(treatments, existingTBs)).toEqual([])
    })

    test('when a treatment inAllBlocks has changed to false, keep one treatment block', () => {
      const existingTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]

      const target = new TreatmentBlockService()
      expect(target.getTBsToRemoveForOneBlockTreatments(treatments, existingTBs))
        .toEqual([{
          id: 3, block_id: 12, treatment_id: 112,
        }])
    })

    test('when a treatment inAllBlocks has not changed, return []', () => {
      const existingTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]

      const target = new TreatmentBlockService()
      expect(target.getTBsToRemoveForOneBlockTreatments(treatments, existingTBs)).toEqual([])
    })
  })

  describe('getTBsToRemoveForAllBlockTreatments', () => {
    test('when a treatment is inAllBlocks and there more existing treatment blocks, return the ones to remove', () => {
      const newAllBlockTBs = [
        {
          id: 2, blockId: 11, treatmentId: 112,
        },
        {
          id: 3, blockId: 12, treatmentId: 112,
        },
      ]

      const existingAllBlockTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
        {
          id: 4, block_id: 13, treatment_id: 112,
        },
      ]
      const target = new TreatmentBlockService()
      target.getExistingAndNewAllBlockTBs = mock({ newAllBlockTBs, existingAllBlockTBs })
      expect(target.getTBsToRemoveForAllBlockTreatments()).toEqual([{
        id: 4, block_id: 13, treatment_id: 112,
      }])
    })

    test('when a treatment is inAllBlocks and there less existing treatment blocks, retrun []', () => {
      const newAllBlockTBs = [
        {
          id: 2, blockId: 11, treatmentId: 112,
        },
        {
          id: 3, blockId: 12, treatmentId: 112,
        },
        {
          id: 4, blockId: 13, treatmentId: 112,
        },
      ]

      const existingAllBlockTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
      ]
      const target = new TreatmentBlockService()
      target.getExistingAndNewAllBlockTBs = mock({ newAllBlockTBs, existingAllBlockTBs })
      expect(target.getTBsToRemoveForAllBlockTreatments()).toEqual([])
    })
  })

  describe('getNewTBsForExistingTreatments', () => {
    test('when a treatment is inAllBlocks and there more existing treatment blocks, return []', () => {
      const newAllBlockTBs = [
        {
          id: 2, blockId: 11, treatmentId: 112,
        },
        {
          id: 3, blockId: 12, treatmentId: 112,
        },
      ]

      const existingAllBlockTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
        {
          id: 4, block_id: 13, treatment_id: 112,
        },
      ]
      const target = new TreatmentBlockService()
      target.getExistingAndNewAllBlockTBs = mock({ newAllBlockTBs, existingAllBlockTBs })
      expect(target.getNewTBsForExistingTreatments()).toEqual([])
    })

    test('when a treatment is inAllBlocks and there less existing treatment blocks, retrun the new ones', () => {
      const newAllBlockTBs = [
        {
          id: 2, blockId: 11, treatmentId: 112,
        },
        {
          id: 3, blockId: 12, treatmentId: 112,
        },
        {
          id: 4, blockId: 13, treatmentId: 112,
        },
      ]

      const existingAllBlockTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
      ]
      const target = new TreatmentBlockService()
      target.getExistingAndNewAllBlockTBs = mock({ newAllBlockTBs, existingAllBlockTBs })
      expect(target.getNewTBsForExistingTreatments()).toEqual([{
        id: 4, blockId: 13, treatmentId: 112,
      }])
    })
  })

  describe('getExistingAndNewAllBlockTBs', () => {
    test('when there is no inAllBlocks treatments, return {[], []}', () => {
      const existingAllBlockTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]
      const target = new TreatmentBlockService()
      target.assembleNewInAllTreatmentBlocks = mock([])
      expect(target.getExistingAndNewAllBlockTBs(treatments, existingAllBlockTBs, []))
        .toEqual({ newAllBlockTBs: [], existingAllBlockTBs: [] })
    })

    test('get the new and existing treatment blocks for the inAllBlocks treatment', () => {
      const newAllBlockTBs = [
        {
          id: 2, blockId: 11, treatmentId: 112,
        },
        {
          id: 3, blockId: 12, treatmentId: 112,
        },
        {
          id: 4, blockId: 13, treatmentId: 112,
        },
      ]

      const existingAllBlockTBs = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
        {
          id: 3, block_id: 12, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: null, inAllBlocks: true,
        },
      ]
      const target = new TreatmentBlockService()
      target.assembleNewInAllTreatmentBlocks = mock(newAllBlockTBs)
      expect(target.getExistingAndNewAllBlockTBs(treatments, existingAllBlockTBs, []))
        .toEqual({ newAllBlockTBs, existingAllBlockTBs })
    })
  })

  describe('batchUpdateOneBlockTreatmentBlocks', () => {
    test('when all existing treatments are inAllBlocks, no treatment block is updated', () => {
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: false, inAllBlocks: true,
        },
      ]
      db.treatmentBlock.batchUpdate = mockResolve([])
      const target = new TreatmentBlockService()
      target.assembleTBsForExistingTreatments = mock([])
      return target.batchUpdateOneBlockTreatmentBlocks(treatments, [], [], {}, testTx).then(() => {
        expect(target.assembleTBsForExistingTreatments).toHaveBeenCalledWith([], [], [])
        expect(db.treatmentBlock.batchUpdate).toHaveBeenCalledWith([], {}, testTx)
      })
    })

    test('get one block treatments and update treatment blocks', () => {
      const treatmentBlocks = [
        {
          id: 2, blockId: 11, treatmentId: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]
      db.treatmentBlock.batchUpdate = mockResolve([])
      const target = new TreatmentBlockService()
      target.assembleTBsForExistingTreatments = mock(treatmentBlocks)
      return target.batchUpdateOneBlockTreatmentBlocks(treatments, [], [], {}, testTx).then(() => {
        expect(target.assembleTBsForExistingTreatments).toHaveBeenCalledWith(treatments, [], [])
        expect(db.treatmentBlock.batchUpdate).toHaveBeenCalledWith(treatmentBlocks, {}, testTx)
      })
    })
  })

  describe('assembleTBsForExistingTreatments', () => {
    test('found an existing treatment block for a treatment, return []', () => {
      const treatmentBlocks = [
        {
          id: 2, block_id: 11, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]
      const blocks = [
        {
          id: 11, name: 'block1',
        },
      ]
      const target = new TreatmentBlockService()
      expect(target.assembleTBsForExistingTreatments(treatments, treatmentBlocks, blocks)).toEqual([])
    })

    test('assemble treatment block for a treatment', () => {
      const treatmentBlocks = [
        {
          id: 2, block_id: 12, treatment_id: 112,
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]
      const blocks = [
        {
          id: 11, name: 'block1',
        },
      ]
      const target = new TreatmentBlockService()
      expect(target.assembleTBsForExistingTreatments(treatments, treatmentBlocks, blocks))
        .toEqual([{ id: 2, treatmentId: 112, blockId: 11 }])
    })
  })

  describe('assembleNewTreatmentBlocks', () => {
    test('empty treatment blocks when there is no block info', () => {
      const blocks = [
        {
          id: 11, name: 'block1',
        },
        {
          id: 12, name: 'block2',
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block3', inAllBlocks: false,
        },
      ]
      const target = new TreatmentBlockService()
      expect(target.assembleNewTreatmentBlocks(treatments, blocks))
        .toEqual([])
    })

    test('assemble a treatment block for a treatment', () => {
      const blocks = [
        {
          id: 11, name: 'block1',
        },
        {
          id: 12, name: 'block2',
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: 'block1', inAllBlocks: false,
        },
      ]
      const target = new TreatmentBlockService()
      expect(target.assembleNewTreatmentBlocks(treatments, blocks))
        .toEqual([{ treatmentId: 112, blockId: 11 }])
    })
  })

  describe('assembleNewInAllTreatmentBlocks', () => {
    test('each treatment has a treatment block for all bloks', () => {
      const blocks = [
        {
          id: 11, name: 'block1',
        },
        {
          id: 12, name: 'block2',
        },
      ]
      const treatments = [
        {
          id: 112, treatmentNumber: 1, block: null, inAllBlocks: true,
        },
      ]
      const target = new TreatmentBlockService()
      expect(target.assembleNewInAllTreatmentBlocks(treatments, blocks))
        .toEqual([{ treatmentId: 112, blockId: 11 }, { treatmentId: 112, blockId: 12 }])
    })
  })

  describe('treatmentBlocksEqual', () => {
    test('two treatment blocks are equal when treatment ids and block ids are the same', () => {
      const treatmentBlock = { treatmentId: 112, blockId: 11 }
      const treatmentBlockInDB = { treatment_id: 112, block_id: 11 }
      const target = new TreatmentBlockService()
      expect(target.treatmentBlocksEqual(treatmentBlock, treatmentBlockInDB)).toBeTruthy()
    })
    test('two treatment blocks are not equal when block ids are different', () => {
      const treatmentBlock = { treatmentId: 112, blockId: 11 }
      const treatmentBlockInDB = { treatment_id: 112, block_id: 12 }
      const target = new TreatmentBlockService()
      expect(target.treatmentBlocksEqual(treatmentBlock, treatmentBlockInDB)).toBeFalsy()
    })
  })

  describe('findTBByTreatmentId', () => {
    test('find the treatment blocks by the treatment id', () => {
      const treatmentBlocks = [{ treatment_id: 112, block_id: 12 }, { treatment_id: 113, block_id: 12 }]
      const target = new TreatmentBlockService()
      expect(target.findTBByTreatmentId(treatmentBlocks, 112))
        .toEqual({ treatment_id: 112, block_id: 12 })
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

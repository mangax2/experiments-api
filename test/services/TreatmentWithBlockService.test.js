import TreatmentWithBlockService from '../../src/services/TreatmentWithBlockService'
import db from '../../src/db/DbManager'
import { mockReject, mockResolve } from '../jestUtil'

describe('TreatmentWithBlockService', () => {
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  describe('getTreatmentsByExperimentIdWithTemplateCheck', () => {
    test('failed on template check', () => {
      const target = new TreatmentWithBlockService()
      target.experimentService.findExperimentWithTemplateCheck = mockReject()
      target.getTreatmentsByExperimentId = mockResolve([])

      return target.getTreatmentsByExperimentIdWithTemplateCheck(1, false, {}, testTx)
        .catch(() => {
          expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {}, testTx)
          expect(target.getTreatmentsByExperimentId).not.toHaveBeenCalled()
        })
    })

    test('passed with template check', () => {
      const target = new TreatmentWithBlockService()
      target.experimentService.findExperimentWithTemplateCheck = mockResolve([])
      target.getTreatmentsByExperimentId = mockResolve([])

      return target.getTreatmentsByExperimentIdWithTemplateCheck(1, false, {}, testTx)
        .then(() => {
          expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {}, testTx)
          expect(target.getTreatmentsByExperimentId).toHaveBeenCalledWith(1, testTx)
        })
    })
  })

  describe('getTreatmentsByExperimentId', () => {
    test('get treatments and treatment blocks', () => {
      db.treatment.findAllByExperimentId = mockResolve([])
      const target = new TreatmentWithBlockService()
      target.treatmentBlockService.getTreatmentBlocksByExperimentId = mockResolve([])
      target.getTreatmentsWithBlockInfo = mockResolve([])

      target.getTreatmentsByExperimentId(1, testTx).then((data) => {
        expect(db.treatment.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.treatmentBlockService.getTreatmentBlocksByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.getTreatmentsWithBlockInfo).toHaveBeenCalledWith([], [])
        expect(data).toEqual([])
      })
    })
  })

  describe('getTreatmentsByBySetIds', () => {
    test('get treatments and treatment blocks', () => {
      db.treatment.batchFindAllBySetId = mockResolve([])
      const target = new TreatmentWithBlockService()
      target.treatmentBlockService.getTreatmentBlocksByTreatmentIds = mockResolve([])
      target.getTreatmentsWithBlockInfo = mockResolve([])

      target.getTreatmentsByBySetIds(1, testTx).then((data) => {
        expect(db.treatment.batchFindAllBySetId).toHaveBeenCalledWith(1, testTx)
        expect(target.treatmentBlockService.getTreatmentBlocksByTreatmentIds).toHaveBeenCalledWith([], testTx)
        expect(target.getTreatmentsWithBlockInfo).toHaveBeenCalledWith([], [])
        expect(data).toEqual([])
      })
    })
  })

  describe('getTreatmentsWithBlockInfo', () => {
    test('found treatment blocks and they are treatments in a single block', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 112, name: 'block2',
        },
      ]

      const treatments = [{
        id: 111, treatmentNumber: 1,
      },
      {
        id: 112, treatmentNumber: 2,
      }]
      const target = new TreatmentWithBlockService()

      expect(target.getTreatmentsWithBlockInfo(treatments, treatmentBlocks)).toEqual([
        {
          id: 111, treatmentNumber: 1, blockId: 11, block: 'block1', inAllBlocks: false,
        },
        {
          id: 112, treatmentNumber: 2, blockId: 12, block: 'block2', inAllBlocks: false,
        },
      ])
    })

    test('found treatment blocks and they is an inAllBlocks treatment', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 111, name: 'block2',
        },
        {
          id: 2, block_id: 12, treatment_id: 112, name: 'block2',
        },
      ]

      const treatments = [{
        id: 111, treatmentNumber: 1,
      },
      {
        id: 112, treatmentNumber: 2,
      }]
      const target = new TreatmentWithBlockService()

      expect(target.getTreatmentsWithBlockInfo(treatments, treatmentBlocks)).toEqual([
        {
          id: 111, treatmentNumber: 1, blockId: null, block: null, inAllBlocks: true,
        },
        {
          id: 112, treatmentNumber: 2, blockId: 12, block: 'block2', inAllBlocks: false,
        },
      ])
    })
  })

  describe('associateBlockInfoToTreatment', () => {
    test('found the matching treatment block and it is a single block treatment', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
      ]

      const treatments = { id: 111, treatmentNumber: 1 }

      const target = new TreatmentWithBlockService()
      expect(target.associateBlockInfoToTreatment(treatments, treatmentBlocks)).toEqual(
        {
          id: 111, treatmentNumber: 1, block: 'block1', blockId: 11, inAllBlocks: false,
        },
      )
    })

    test('found the matching treatment block and it is an inAllBlocks treatment', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 111, name: 'block2',
        },
      ]

      const treatments = { id: 111, treatmentNumber: 1 }

      const target = new TreatmentWithBlockService()
      expect(target.associateBlockInfoToTreatment(treatments, treatmentBlocks)).toEqual(
        {
          id: 111, treatmentNumber: 1, block: null, blockId: null, inAllBlocks: true,
        },
      )
    })
  })

  describe('createTreatments', () => {
    test('create treatments and treatment blocks for these treatments', () => {
      const treatments = [{ treatmentNumber: 1 }, { treatmentNumber: 2 }]
      const treatmentCreateResponse = [{ id: 111 }, { id: 112 }]

      const target = new TreatmentWithBlockService()
      target.treatmentService.batchCreateTreatments = mockResolve(treatmentCreateResponse)
      target.treatmentBlockService.createTreatmentBlocksByExperimentId = mockResolve([])

      return target.createTreatments(1, treatments, {}, testTx).then((data) => {
        expect(target.treatmentBlockService.createTreatmentBlocksByExperimentId).toHaveBeenCalledWith(1,
          [{ id: 111, treatmentNumber: 1 }, { id: 112, treatmentNumber: 2 }], {}, testTx)
        expect(data).toEqual(treatmentCreateResponse)
      })
    })
  })

  describe('updateTreatments', () => {
    test('update treatments and handle add/remove/update treatment blocks for these treatments', () => {
      const target = new TreatmentWithBlockService()
      target.treatmentService.batchUpdateTreatments = mockResolve([])
      target.treatmentBlockService.handleTreatmentBlocksForExistingTreatments = mockResolve([])

      return target.updateTreatments(1, [], {}, testTx).then(() => {
        expect(target.treatmentService.batchUpdateTreatments).toHaveBeenCalledWith([], {}, testTx)
        expect(target.treatmentBlockService.handleTreatmentBlocksForExistingTreatments).toHaveBeenCalledWith(1, [], {}, testTx)
      })
    })
  })
})

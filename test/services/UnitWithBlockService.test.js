import UnitWithBlockService from '../../src/services/UnitWithBlockService'
import db from '../../src/db/DbManager'
import { mock, mockReject, mockResolve } from '../jestUtil'

describe('UnitWithBlockService', () => {
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  describe('getUnitsFromTemplateByExperimentId', () => {
    test('The call fails getExperimentById check', () => {
      const target = new UnitWithBlockService()
      target.experimentService.findExperimentWithTemplateCheck = mockReject()
      target.getExperimentalUnitsByExperimentId = mockResolve([])
      return target.getUnitsFromTemplateByExperimentId(1, {}, testTx).catch(() => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, true, {}, testTx)
        expect(target.getExperimentalUnitsByExperimentId).not.toHaveBeenCalled()
      })
    })

    test('The call passes getExperimentById check', () => {
      const target = new UnitWithBlockService()
      target.experimentService.findExperimentWithTemplateCheck = mockResolve()
      target.getExperimentalUnitsByExperimentId = mockResolve([])
      return target.getUnitsFromTemplateByExperimentId(1, {}, testTx).then((data) => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, true, {}, testTx)
        expect(target.getExperimentalUnitsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([])
      })
    })
  })

  describe('getUnitsFromExperimentByExperimentId', () => {
    test('The call fails getExperimentById check', () => {
      const target = new UnitWithBlockService()
      target.experimentService.findExperimentWithTemplateCheck = mockReject()
      target.getExperimentalUnitsByExperimentId = mockResolve([])
      return target.getUnitsFromExperimentByExperimentId(1, {}, testTx).catch(() => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(target.getExperimentalUnitsByExperimentId).not.toHaveBeenCalled()
      })
    })

    test('The call passes getExperimentById check', () => {
      const target = new UnitWithBlockService()
      target.experimentService.findExperimentWithTemplateCheck = mockResolve()
      target.getExperimentalUnitsByExperimentId = mockResolve([])
      return target.getUnitsFromExperimentByExperimentId(1, {}, testTx).then((data) => {
        expect(target.experimentService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(target.getExperimentalUnitsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual([])
      })
    })
  })

  describe('getExperimentalUnitsByExperimentId', () => {
    test('get units with treatment block info', () => {
      db.unit.findAllByExperimentId = mockResolve([])
      const target = new UnitWithBlockService()
      target.treatmentBlockService.getTreatmentBlocksByExperimentId = mockResolve([])
      target.addBlockInfoToUnit = mock([])
      return target.getExperimentalUnitsByExperimentId(1, testTx).then(() => {
        expect(db.unit.findAllByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.treatmentBlockService.getTreatmentBlocksByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.addBlockInfoToUnit).toHaveBeenCalledWith([], [])
      })
    })
  })

  describe('getExperimentalUnitsBySetIds', () => {
    test('get units with treatment block info', () => {
      db.unit.batchFindAllBySetIds = mockResolve([])
      const target = new UnitWithBlockService()
      target.treatmentBlockService.getTreatmentBlocksByIds = mockResolve([])
      target.addBlockInfoToUnit = mock([])
      return target.getExperimentalUnitsBySetIds(1, testTx).then(() => {
        expect(db.unit.batchFindAllBySetIds).toHaveBeenCalledWith(1, testTx)
        expect(target.treatmentBlockService.getTreatmentBlocksByIds).toHaveBeenCalledWith([], testTx)
        expect(target.addBlockInfoToUnit).toHaveBeenCalledWith([], [])
      })
    })
  })

  describe('addBlockInfoToUnit', () => {
    test('match units with treatment blocks', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 112, name: 'block2',
        },
      ]
      const units = [
        { treatment_block_id: 1, rep: 1, loc: 1 },
        { treatment_block_id: 2, rep: 1, loc: 1 },
      ]
      const target = new UnitWithBlockService()
      expect(target.addBlockInfoToUnit(units, treatmentBlocks))
        .toEqual([{
          treatment_block_id: 1, rep: 1, loc: 1, block: 'block1',
        },
        {
          treatment_block_id: 2, rep: 1, loc: 1, block: 'block2',
        }])
    })

    test('there is no matching treatment block with a unit', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 112, name: 'block2',
        },
      ]
      const units = [
        { treatment_block_id: 1, rep: 1, loc: 1 },
        { treatment_block_id: 3, rep: 1, loc: 1 },
      ]
      const target = new UnitWithBlockService()
      expect(target.addBlockInfoToUnit(units, treatmentBlocks))
        .toEqual([{
          treatment_block_id: 1, rep: 1, loc: 1, block: 'block1',
        },
        {
          treatment_block_id: 3, rep: 1, loc: 1, block: '',
        }])
    })
  })

  describe('addTreatmentBlocksToUnits', () => {
    test('match units with treatment blocks', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 112, name: 'block2',
        },
      ]
      const units = [
        {
          rep: 1, loc: 1, treatmentId: 111, block: 'block1',
        },
        {
          rep: 1, loc: 1, treatmentId: 112, block: 'block2',
        },
      ]
      const target = new UnitWithBlockService()
      expect(target.addTreatmentBlocksToUnits(units, treatmentBlocks))
        .toEqual([{
          treatmentBlockId: 1, treatmentId: 111, rep: 1, loc: 1, block: 'block1',
        },
        {
          treatmentBlockId: 2, treatmentId: 112, rep: 1, loc: 1, block: 'block2',
        }])
    })
  })

  describe('findTreatmentBlockId', () => {
    test('found the matching treatment block', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 111, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 112, name: 'block2',
        },
      ]
      const unit = {
        rep: 1, loc: 1, treatmentId: 111, block: 'block1',
      }

      const target = new UnitWithBlockService()
      expect(target.findTreatmentBlockId(unit, treatmentBlocks)).toEqual(1)
    })

    test('did not find the matching treatment block', () => {
      const treatmentBlocks = [
        {
          id: 1, block_id: 11, treatment_id: 113, name: 'block1',
        },
        {
          id: 2, block_id: 12, treatment_id: 112, name: 'block2',
        },
      ]
      const unit = {
        rep: 1, loc: 1, treatmentId: 111, block: 'block1',
      }

      const target = new UnitWithBlockService()
      expect(target.findTreatmentBlockId(unit, treatmentBlocks)).toEqual(null)
    })
  })
})

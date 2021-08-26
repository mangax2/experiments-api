import TreatmentWithBlockService from '../../src/services/TreatmentWithBlockService'
import { dbRead } from '../../src/db/DbManager'
import { mockReject, mockResolve } from '../jestUtil'

describe('TreatmentWithBlockService', () => {
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

  describe('getTreatmentsByExperimentIdWithTemplateCheck', () => {
    test('failed on template check', () => {
      const target = new TreatmentWithBlockService()
      target.experimentsService.findExperimentWithTemplateCheck = mockReject()
      target.getTreatmentsByExperimentId = mockResolve([])

      return target.getTreatmentsByExperimentIdWithTemplateCheck(1, false, {})
        .catch(() => {
          expect(target.experimentsService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {})
          expect(target.getTreatmentsByExperimentId).not.toHaveBeenCalled()
        })
    })

    test('passed with template check', () => {
      const target = new TreatmentWithBlockService()
      target.experimentsService.findExperimentWithTemplateCheck = mockResolve([])
      target.getTreatmentsByExperimentId = mockResolve([])

      return target.getTreatmentsByExperimentIdWithTemplateCheck(1, false, {})
        .then(() => {
          expect(target.experimentsService.findExperimentWithTemplateCheck).toHaveBeenCalledWith(1, false, {})
          expect(target.getTreatmentsByExperimentId).toHaveBeenCalledWith(1)
        })
    })
  })

  describe('getTreatmentsByExperimentId', () => {
    test('calls the repo and returns the result', () => {
      dbRead.treatment.findAllByExperimentId = mockResolve([])
      const target = new TreatmentWithBlockService()

      return target.getTreatmentsByExperimentId(1).then((data) => {
        expect(dbRead.treatment.findAllByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })
  })

  describe('getTreatmentsByBySetIds', () => {
    test('calls the repo and returns the result', () => {
      dbRead.treatment.batchFindAllBySetId = mockResolve([])
      const target = new TreatmentWithBlockService()

      return target.getTreatmentsByBySetIds(1).then((data) => {
        expect(dbRead.treatment.batchFindAllBySetId).toHaveBeenCalledWith(1)
        expect(data).toEqual([])
      })
    })
  })

  describe('createTreatments', () => {
    test('create treatments and treatment blocks for these treatments', () => {
      const treatments = [{ treatmentNumber: 1 }, { treatmentNumber: 2 }]
      const treatmentCreateResponse = [{ id: 111 }, { id: 112 }]

      const target = new TreatmentWithBlockService()
      target.treatmentService.batchCreateTreatments = mockResolve(treatmentCreateResponse)
      target.treatmentBlockService.createTreatmentBlocksByExperimentId = mockResolve([])

      return target.createTreatments(1, treatments, [], {}, testTx).then((data) => {
        expect(target.treatmentBlockService.createTreatmentBlocksByExperimentId).toHaveBeenCalledWith(1,
          [{ id: 111, treatmentNumber: 1 }, { id: 112, treatmentNumber: 2 }], [], {}, testTx)
        expect(data).toEqual(treatmentCreateResponse)
      })
    })
  })

  describe('updateTreatments', () => {
    test('update treatments and handle add/remove/update treatment blocks for these treatments', () => {
      const target = new TreatmentWithBlockService()
      target.treatmentService.batchUpdateTreatments = mockResolve([])
      target.treatmentBlockService.persistTreatmentBlocksForExistingTreatments = mockResolve([])

      return target.updateTreatments(1, [], [], {}, testTx).then(() => {
        expect(target.treatmentService.batchUpdateTreatments).toHaveBeenCalledWith([], {}, testTx)
        expect(target.treatmentBlockService.persistTreatmentBlocksForExistingTreatments).toHaveBeenCalledWith(1, [], [], {}, testTx)
      })
    })
  })
})

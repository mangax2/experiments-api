import TreatmentBlockService from '../../src/services/TreatmentBlockService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'
import { mock, mockReject, mockResolve } from '../jestUtil'

describe('TreatmentBlockService', () => {
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }

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

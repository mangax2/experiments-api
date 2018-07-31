import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentSummaryService from '../../src/services/ExperimentSummaryService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('ExperimentSummaryService', () => {
  let target
  const testTx = { tx: {} }

  beforeEach(() => {
    expect.hasAssertions()
    target = new ExperimentSummaryService()
  })

  describe('getExperimentSummaryById', () => {
    test('returns summary data', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.experimentSummary.find = mockResolve({})

      return target.getExperimentSummaryById(1, false, {}, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    test('throws an error when summary is not found', () => {
      target.experimentService.getExperimentById = mockResolve()
      db.experimentSummary.find = mockResolve()
      AppError.notFound = mock()

      return target.getExperimentSummaryById(1, false, {}, testTx).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Summary Not Found for requested experimentId', undefined, '191001')
      })
    })

    test('rejects when experimentSummary find fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockResolve()
      db.experimentSummary.find = mockReject(error)

      return target.getExperimentSummaryById(1, false, {}, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      db.experimentSummary.find = mock()

      return target.getExperimentSummaryById(1, false, {}, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {}, testTx)
        expect(db.experimentSummary.find).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})

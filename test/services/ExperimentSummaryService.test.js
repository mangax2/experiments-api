import ExperimentSummaryService from '../../src/services/ExperimentSummaryService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('ExperimentSummaryService', () => {
  const testTx = { tx: {} }

  describe('getExperimentSummaryById', () => {
    it('returns summary data', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.resolve())
      db.experimentSummary.find = jest.fn(() => Promise.resolve({}))

      return target.getExperimentSummaryById(1, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when summary is not found', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.resolve())
      db.experimentSummary.find = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

      return target.getExperimentSummaryById(1, testTx).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Summary Not Found for' +
          ' requested experimentId')
      })
    })

    it('rejects when experimentSummary find fails', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.resolve())
      db.experimentSummary.find = jest.fn(() => Promise.reject())

      return target.getExperimentSummaryById(1, testTx).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('rejects when getExperimentById fails', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = jest.fn(() => Promise.reject())
      db.experimentSummary.find = jest.fn()

      return target.getExperimentSummaryById(1, testTx).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).not.toHaveBeenCalled()
      })
    })
  })
})
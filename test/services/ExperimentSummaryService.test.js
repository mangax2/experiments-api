import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentSummaryService from '../../src/services/ExperimentSummaryService'
import db from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('ExperimentSummaryService', () => {
  const testTx = { tx: {} }

  describe('getExperimentSummaryById', () => {
    it('returns summary data', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = mockResolve()
      db.experimentSummary.find = mockResolve({})

      return target.getExperimentSummaryById(1, testTx).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({})
      })
    })

    it('throws an error when summary is not found', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = mockResolve()
      db.experimentSummary.find = mockResolve()
      AppError.notFound = mock()

      return target.getExperimentSummaryById(1, testTx).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Summary Not Found for' +
          ' requested experimentId')
      })
    })

    it('rejects when experimentSummary find fails', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = mockResolve()
      db.experimentSummary.find = mockReject('error')

      return target.getExperimentSummaryById(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when getExperimentById fails', () => {
      const target = new ExperimentSummaryService()
      target.experimentService.getExperimentById = mockReject('error')
      db.experimentSummary.find = mock()

      return target.getExperimentSummaryById(1, testTx).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, testTx)
        expect(db.experimentSummary.find).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })
})
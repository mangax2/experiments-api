import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentSummaryService from '../../src/services/ExperimentSummaryService'
import { dbRead } from '../../src/db/DbManager'
import AppError from '../../src/services/utility/AppError'

describe('ExperimentSummaryService', () => {
  let target

  beforeEach(() => {
    target = new ExperimentSummaryService()
  })

  describe('getExperimentSummaryById', () => {
    test('returns summary data', () => {
      target.experimentService.getExperimentById = mockResolve()
      dbRead.experimentSummary.find = mockResolve({})

      return target.getExperimentSummaryById(1, false, {}).then((data) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {})
        expect(dbRead.experimentSummary.find).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    test('throws an error when summary is not found', () => {
      target.experimentService.getExperimentById = mockResolve()
      dbRead.experimentSummary.find = mockResolve()
      AppError.notFound = mock()

      return target.getExperimentSummaryById(1, false, {}).then(() => {}, () => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {})
        expect(dbRead.experimentSummary.find).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Summary Not Found for requested experimentId', undefined, '191001')
      })
    })

    test('rejects when experimentSummary find fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockResolve()
      dbRead.experimentSummary.find = mockReject(error)

      return target.getExperimentSummaryById(1, false, {}).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {})
        expect(dbRead.experimentSummary.find).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })

    test('rejects when getExperimentById fails', () => {
      const error = { message: 'error' }
      target.experimentService.getExperimentById = mockReject(error)
      dbRead.experimentSummary.find = mock()

      return target.getExperimentSummaryById(1, false, {}).then(() => {}, (err) => {
        expect(target.experimentService.getExperimentById).toHaveBeenCalledWith(1, false, {})
        expect(dbRead.experimentSummary.find).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })
})

import { mock, mockResolve, mockReject } from '../jestUtil'
import DuplicationService from '../../src/services/DuplicationService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('DuplicationService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  db.duplication.repository = mock({ tx: function (transactionName, callback) {return callback(testTx)} })

  beforeEach(() => {
    target = new DuplicationService()
  })

  describe('duplicateExperiment', () => {
    it('duplicates and returns the new experiment id that was created', () => {
      db.duplication.duplicateExperiment = mockResolve({id: 2})
      AppUtil.createPostResponse = mock()

      return DuplicationService.duplicateExperiment({id: 1}, testContext, testTx).then(() => {
        expect(db.duplication.duplicateExperiment).toHaveBeenCalledWith(1, testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{id: 2}])
      })
    })

    it('rejects when db duplicateExperiment fails', () => {
      db.duplication.duplicateExperiment = mockReject('error')
      AppUtil.createPostResponse = mock()

      return DuplicationService.duplicateExperiment({id: 1}, testContext, testTx).then(() => {}, (err) => {
        expect(db.duplication.duplicateExperiment).toHaveBeenCalledWith(1, testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('throws a bad request when no experiment is found to duplicate', () => {
      db.duplication.duplicateExperiment = mockResolve(null)
      AppError.badRequest = mock('')

      return DuplicationService.duplicateExperiment({id: 1}, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment Not Found To Duplicate For Id: 1')
      })
    })

    it('throws a bad request when id is missing from the body', () => {
      AppError.badRequest = mock('')

      expect(() => DuplicationService.duplicateExperiment({}, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain an experiment id to duplicate')
    })

    it('throws a bad request when body is missing from request', () => {
      AppError.badRequest = mock('')

      expect(() => DuplicationService.duplicateExperiment(null, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain an experiment id to duplicate')
    })
  })
})
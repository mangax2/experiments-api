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

  describe('duplicateExperiments', () => {
    it('calls duplicateExperiment the required number of times', () => {
      AppUtil.createPostResponse = jest.fn(() => 'success')
      target.duplicateExperiment = jest.fn(() => Promise.resolve())

      return target.duplicateExperiments({ ids: [1], numberOfCopies: 2 }, testContext, testTx).then(() => {
        expect(target.duplicateExperiment).toHaveBeenCalledTimes(2)
        expect(AppUtil.createPostResponse).toHaveBeenCalledTimes(1)
      })
    })

    it('throws only one error if multiple occur', (done) => {
      target.duplicateExperiment = jest.fn(() => Promise.reject('error'))

      return target.duplicateExperiments({ ids: [1], numberOfCopies: 2 }, testContext, testTx).catch((err) => {
        expect(target.duplicateExperiment).toHaveBeenCalledTimes(2)
        expect(err).toBe('error')
        done()
      })
    })

    it('throws a bad request when numberOfCopies is missing from the body', () => {
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments({ids: [1]}, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })

    it('throws a bad request when ids has no values is missing from the body', () => {
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments({ids: []}, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })

    it('throws a bad request when id is missing from the body', () => {
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments({}, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })

    it('throws a bad request when body is missing from request', () => {
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments(null, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })
  })

  describe('duplicateExperiment', () => {
    it('duplicates and returns the new experiment id that was created', () => {
      db.duplication.duplicateExperiment = mockResolve({id: 2})
      target.tagService.copyTags = mockResolve()

      return target.duplicateExperiment(1, testContext, testTx).then((data) => {
        expect(db.duplication.duplicateExperiment).toHaveBeenCalledWith(1, testContext, testTx)
        expect(data).toEqual({id: 2})
      })
    })

    it('throws a bad request when tagging api returns error', () => {
      db.duplication.duplicateExperiment = mockResolve({id: 2})
      target.tagService.copyTags = mockReject()
      AppError.badRequest = mock()

      return target.duplicateExperiment(1, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Duplications Failed, Tagging API' +
          ' returned error')
      })
    })

    it('rejects when db duplicateExperiment fails', () => {
      db.duplication.duplicateExperiment = mockReject('error')
      AppUtil.createPostResponse = mock()

      return target.duplicateExperiment(1, testContext, testTx).then(() => {}, (err) => {
        expect(db.duplication.duplicateExperiment).toHaveBeenCalledWith(1, testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('throws a bad request when no experiment is found to duplicate', () => {
      db.duplication.duplicateExperiment = mockResolve(null)
      AppError.badRequest = mock('')

      return target.duplicateExperiment(1, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment Not Found To Duplicate For Id: 1')
      })
    })
  })
})
import { mock, mockResolve, mockReject } from '../jestUtil'
import DuplicationService from '../../src/services/DuplicationService'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import db from '../../src/db/DbManager'

describe('DuplicationService', () => {
  const testContext = {}
  const testTx = { tx: {} }
  db.duplication.repository = mock({ tx: function (transactionName, callback) {return callback(testTx)} })

  describe('duplicateExperiments', () => {
    it('calls the correct functions if valid', () => {
      const target = new DuplicationService()
      target.getAllTagsToDuplicate = jest.fn(() => Promise.resolve({tags: null}))
      target.duplicateExperimentData = jest.fn(() => Promise.resolve({ids: null}))
      target.duplicateTagsForExperiments = jest.fn(() => Promise.resolve())

      return target.duplicateExperiments({ ids: [1], numberOfCopies: 2 }, testContext,false, testTx).then(() => {
        expect(target.getAllTagsToDuplicate).toBeCalledWith([1],false)
        expect(target.duplicateExperimentData).toBeCalledWith([1], 2, false,testContext,false)
        expect(target.duplicateTagsForExperiments).toBeCalledWith({tags: null}, {ids: null}, testContext)
      })
    })

    it('throws a bad request when numberOfCopies is missing from the body', () => {
      const target = new DuplicationService()
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments({ids: [1]}, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })

    it('throws a bad request when ids has no values is missing from the body', () => {
      const target = new DuplicationService()
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments({ids: []}, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })

    it('throws a bad request when id is missing from the body', () => {
      const target = new DuplicationService()
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments({}, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })

    it('throws a bad request when body is missing from request', () => {
      const target = new DuplicationService()
      AppError.badRequest = mock('')

      expect(() => target.duplicateExperiments(null, testContext, testTx)).toThrow()
      expect(AppError.badRequest).toHaveBeenCalledWith('Body must contain at least one experiment id to duplicate and the number of copies to make.')
    })
  })

  describe('duplicateExperimentData', () => {
    it('calls duplicateExperiment the correct number of times', () => {
      const target = new DuplicationService()
      db.duplication.duplicateExperiment = jest.fn(() => Promise.resolve({}))

      return target.duplicateExperimentData([3, 5], 3, false,testContext, testTx)
        .then((result) => {
          expect(result.length).toBe(6)
          expect(db.duplication.duplicateExperiment).toHaveBeenCalledTimes(6)
        })
    })
  })

  describe('getAllTagsToDuplicate', () => {
    it('calls the tag service for each id passed in', () => {
      const target = new DuplicationService()
      target.tagService = { getTagsByExperimentId: jest.fn(() => Promise.resolve()) }

      return target.getAllTagsToDuplicate([3, 5, 7],false).then(() => {
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledTimes(3)
        expect(target.tagService.getTagsByExperimentId).toBeCalledWith(3,false)
        expect(target.tagService.getTagsByExperimentId).toBeCalledWith(5,false)
        expect(target.tagService.getTagsByExperimentId).toBeCalledWith(7,false)
      })
    })

    it('returns an object with keys that match the ids passed in', () => {
      const target = new DuplicationService()
      target.tagService = { getTagsByExperimentId: jest.fn(() => Promise.resolve([])) }

      return target.getAllTagsToDuplicate([3, 5, 7]).then((result) => {
        expect(result[3]).toEqual([])
        expect(result[5]).toEqual([])
        expect(result[7]).toEqual([])
      })
    })
  })

  describe('duplicateTagsForExperiments', () => {
    it('does not call tagService if no tags to create', () => {
      const target = new DuplicationService()
      target.tagService = { batchCreateTags: jest.fn(() => Promise.resolve() ) }
      AppUtil.createPostResponse = jest.fn()

      return target.duplicateTagsForExperiments({}, [{ oldId: 3, newId: 5 }], testContext).then(() => {
        expect(target.tagService.batchCreateTags).not.toBeCalled()
        expect(AppUtil.createPostResponse).toBeCalledWith([{ id: 5 }])
      })
    })

    it('does call tagService if there are tags to create', () => {
      const target = new DuplicationService()
      const tagsToDuplicate = {}
      tagsToDuplicate[3] = [{ category: 'category', value: 'value' }]
      target.tagService = { batchCreateTags: jest.fn(() => Promise.resolve() ) }
      AppUtil.createPostResponse = jest.fn()

      return target.duplicateTagsForExperiments(tagsToDuplicate, [{ oldId: 3, newId: 5 }], testContext).then(() => {
        expect(target.tagService.batchCreateTags).toBeCalledWith([{ experimentId: 5, category: 'category', value: 'value' }], testContext)
        expect(AppUtil.createPostResponse).toBeCalledWith([{ id: 5 }])
      })
    })
  })
})
import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentsService from '../../src/services/ExperimentsService'
import db from '../../src/db/DbManager'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'

describe('ExperimentsService', () => {
  const testContext = {}
  const testTx = { tx: {} }

  describe('batchCreateExperiments', () => {
    it('calls validate, batchCreate, assignExperimentIdToTags, batchCreateTags, and' +
      ' createPostResponse', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{id: 1}])
      })
    })

    it('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but not' +
      ' tagService when there are no tags', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([])
      target.tagService.batchCreateTags = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{id: 1}])
      })
    })

    it('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but not' +
      ' tagService when tags are undefined', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{id: 1}])
      })
    })

    it('rejects when batchCreateTags fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockReject('error')
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockReject('error')
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockReject('error')
      db.experiments.batchCreate = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getExperiments', () => {
    it('calls getAllExperiments', () => {
      const target = new ExperimentsService()
      target.isFilterRequest = mock(false)
      target.getExperimentsByFilters = mock()
      target.getAllExperiments = mock()

      target.getExperiments('')
      expect(target.isFilterRequest).toHaveBeenCalledWith('')
      expect(target.getExperimentsByFilters).not.toHaveBeenCalled()
      expect(target.getAllExperiments).toHaveBeenCalled()
    })

    it('calls getExperimentsByFilters', () => {
      const target = new ExperimentsService()
      target.isFilterRequest = mock(true)
      target.getExperimentsByFilters = mock()
      target.getAllExperiments = mock()

      target.getExperiments('')
      expect(target.isFilterRequest).toHaveBeenCalledWith('')
      expect(target.getExperimentsByFilters).toHaveBeenCalledWith('')
      expect(target.getAllExperiments).not.toHaveBeenCalled()
    })
  })

  describe('getExperimentById', () => {
    it('calls find, getTagsByExperimentId, and returns data', () => {
      const target = new ExperimentsService()
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockResolve([])

      return target.getExperimentById(1, testTx).then((data) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({tags: []})
      })
    })

    it('rejects when tagService fails', () => {
      const target = new ExperimentsService()
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockReject('error')

      return target.getExperimentById(1, testTx).then(() => {}, (err) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('throws when find returns undefined', () => {
      const target = new ExperimentsService()
      db.experiments.find = mockResolve()
      target.tagService.getTagsByExperimentId = mock()
      AppError.notFound = mock()

      return target.getExperimentById(1, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested' +
          ' experimentId')
        expect(target.tagService.getTagsByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('updateExperiment', () => {
    it('calls validate, update, deleteTagsForExperimentId, batchCreateTags', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockResolve()

      return target.updateExperiment(1, {}, testContext, testTx).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{}])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(data).toEqual({})
      })
    })

    it('calls validate, update, deleteTagsForExperimentId, but not batchCreateTags', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.assignExperimentIdToTags = mock([])
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{}])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(data).toEqual({})
      })
    })

    it('rejects when batchCreateTags fails' , () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockReject('error')

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{}])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when deleteTagsForExperimentId fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.tagService.deleteTagsForExperimentId = mockReject('error')
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('throws an error when returned updated data is undefined', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve()
      target.tagService.deleteTagsForExperimentId = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      AppError.notFound = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found to Update')
        expect(target.tagService.deleteTagsForExperimentId).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
      })
    })

    it('rejects when update fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      db.experiments.update = mockReject('error')
      target.tagService.deleteTagsForExperimentId = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockReject('error')
      db.experiments.update = mock()
      target.tagService.deleteTagsForExperimentId = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).not.toHaveBeenCalled()
        expect(target.tagService.deleteTagsForExperimentId).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteExperiment', () => {
    it('returns data when successfully deleted data', () => {
      const target = new ExperimentsService()
      db.experiments.remove = mockResolve({})

      return target.deleteExperiment(1).then((data) => {
        expect(db.experiments.remove).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data is undefined', () => {
      const target = new ExperimentsService()
      db.experiments.remove = mockResolve()
      AppError.notFound = mock()

      return target.deleteExperiment(1).then(() => {}, () => {
        expect(db.experiments.remove).toHaveBeenCalledWith(1)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested' +
          ' experimentId')
      })
    })
  })

  describe('getExperimentsByFilters', () => {
    it('calls validate and findExperimentByTags', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      target.toLowerCaseArray = mock([])
      db.experiments.findExperimentsByTags = mockResolve()

      return target.getExperimentsByFilters('').then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).toHaveBeenCalledTimes(2)
        expect(db.experiments.findExperimentsByTags).toHaveBeenCalledWith([],[])
      })
    })

    it('rejects when findExperimentsByTags fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockResolve()
      target.toLowerCaseArray = mock([])
      db.experiments.findExperimentsByTags = mockReject('error')

      return target.getExperimentsByFilters('').then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).toHaveBeenCalledTimes(2)
        expect(db.experiments.findExperimentsByTags).toHaveBeenCalledWith([],[])
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = mockReject('error')
      target.toLowerCaseArray = mock()
      db.experiments.findExperimentsByTags = mock()

      return target.getExperimentsByFilters('').then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).not.toHaveBeenCalled()
        expect(db.experiments.findExperimentsByTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('getAllExperiments', () => {
    it('calls database', () => {
      const target = new ExperimentsService()
      db.experiments.all = mock()

      target.getAllExperiments()
      expect(db.experiments.all).toHaveBeenCalled()
    })
  })

  describe('assignExperimentIdToTags', () => {
    it('returns empty array when no experimentIds are passed in', () => {
      const target = new ExperimentsService()

      expect(target.assignExperimentIdToTags([], [])).toEqual([])
    })

    it('assigns experiment Id to experiment tags', () => {
      const target = new ExperimentsService()
      const experimentIds = [1]
      const experiments = [{id: 1, tags: [{}]}]

      expect(target.assignExperimentIdToTags(experimentIds, experiments)).toEqual([{experimentId: 1, name: undefined, value: undefined}])
    })

    it('assigns name, value, and experimentId to tags', () => {
      const target = new ExperimentsService()
      const experimentIds = [1]
      const experiments = [{id: 1, tags: [{name: 'testN', value: 'testV'}]}]

      expect(target.assignExperimentIdToTags(experimentIds, experiments)).toEqual([{experimentId: 1, name: 'testn', value: 'testv'}])
    })

    it('returns an empty array when tags are undefined', () => {
      const target = new ExperimentsService()
      const experimentIds = [1]
      const experiments = [{id: 1}]

      expect(target.assignExperimentIdToTags(experimentIds, experiments)).toEqual([])
    })
  })

  describe('isFilterRequest', () => {
    it('returns true when queryString is supplied and contains allowed filters', () =>{
      const target = new ExperimentsService()

      expect(target.isFilterRequest({'tags.name': 'test', 'tags.value': 'test'})).toEqual(true)
    })

    it('returns false when queryString is empty', () => {
      const target = new ExperimentsService()

      expect(target.isFilterRequest()).toEqual(false)
    })

    it('returns false when no matching parameters are supplied', () => {
      const target = new ExperimentsService()

      expect(target.isFilterRequest({'test':'test'})).toEqual(false)
    })

    it('returns true even when extra parameters are supplied', () => {
      const target = new ExperimentsService()

      expect(target.isFilterRequest({'tags.name': 'test', 'tags.value': 'test', 'test': 'test'})).toEqual(true)
    })
  })

  describe('toLowerCaseArray', () => {
    it('lower cases all values from query string value', () => {
      const target = new ExperimentsService()

      expect(target.toLowerCaseArray('x,Y,Z')).toEqual(['x','y','z'])
    })

    it('returns an empty array if not value is given', () => {
      const target = new ExperimentsService()

      expect(target.toLowerCaseArray()).toEqual([])
    })
  })
})
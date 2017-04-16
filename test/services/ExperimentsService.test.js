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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.batchCreate = jest.fn(() => Promise.resolve([{ id: 1 }]))
      target.assignExperimentIdToTags = jest.fn(() => [{}])
      target.tagService.batchCreateTags = jest.fn(() => Promise.resolve({}))
      AppUtil.createPostResponse = jest.fn()

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.batchCreate = jest.fn(() => Promise.resolve([{ id: 1 }]))
      target.assignExperimentIdToTags = jest.fn(() => [])
      target.tagService.batchCreateTags = jest.fn()
      AppUtil.createPostResponse = jest.fn()

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.batchCreate = jest.fn(() => Promise.resolve([{ id: 1 }]))
      target.assignExperimentIdToTags = jest.fn(() => undefined)
      target.tagService.batchCreateTags = jest.fn()
      AppUtil.createPostResponse = jest.fn()

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.batchCreate = jest.fn(() => Promise.resolve([{ id: 1 }]))
      target.assignExperimentIdToTags = jest.fn(() => [{}])
      target.tagService.batchCreateTags = jest.fn(() => Promise.reject())
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], testContext, testTx)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
      })
    })

    it('rejects when batchCreate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.batchCreate = jest.fn(() => Promise.reject())
      target.assignExperimentIdToTags = jest.fn()
      target.tagService.batchCreateTags = jest.fn()
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = jest.fn(() => Promise.reject())
      db.experiments.batchCreate = jest.fn()
      target.assignExperimentIdToTags = jest.fn()
      target.tagService.batchCreateTags = jest.fn()
      AppUtil.createPostResponse = jest.fn()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
      })
    })
  })

  describe('getExperiments', () => {
    it('calls getAllExperiments', () => {
      const target = new ExperimentsService()
      target.isFilterRequest = jest.fn(() => false)
      target.getExperimentsByFilters = jest.fn()
      target.getAllExperiments = jest.fn()

      target.getExperiments('')
      expect(target.isFilterRequest).toHaveBeenCalledWith('')
      expect(target.getExperimentsByFilters).not.toHaveBeenCalled()
      expect(target.getAllExperiments).toHaveBeenCalled()
    })

    it('calls getExperimentsByFilters', () => {
      const target = new ExperimentsService()
      target.isFilterRequest = jest.fn(() => true)
      target.getExperimentsByFilters = jest.fn()
      target.getAllExperiments = jest.fn()

      target.getExperiments('')
      expect(target.isFilterRequest).toHaveBeenCalledWith('')
      expect(target.getExperimentsByFilters).toHaveBeenCalledWith('')
      expect(target.getAllExperiments).not.toHaveBeenCalled()
    })
  })

  describe('getExperimentById', () => {
    it('calls find, getTagsByExperimentId, and returns data', () => {
      const target = new ExperimentsService()
      db.experiments.find = jest.fn(() => Promise.resolve({}))
      target.tagService.getTagsByExperimentId = jest.fn(() => Promise.resolve([]))

      return target.getExperimentById(1, testTx).then((data) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({tags: []})
      })
    })

    it('rejects when tagService fails', () => {
      const target = new ExperimentsService()
      db.experiments.find = jest.fn(() => Promise.resolve({}))
      target.tagService.getTagsByExperimentId = jest.fn(() => Promise.reject(''))

      return target.getExperimentById(1, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, testTx)
      })
    })

    it('throws when find returns undefined', () => {
      const target = new ExperimentsService()
      db.experiments.find = jest.fn(() => Promise.resolve(undefined))
      target.tagService.getTagsByExperimentId = jest.fn()
      AppError.notFound = jest.fn()

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.update = jest.fn(() => Promise.resolve({}))
      target.tagService.deleteTagsForExperimentId = jest.fn(() => Promise.resolve())
      target.assignExperimentIdToTags = jest.fn(() => [{}])
      target.tagService.batchCreateTags = jest.fn(() => Promise.resolve())

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.update = jest.fn(() => Promise.resolve({}))
      target.tagService.deleteTagsForExperimentId = jest.fn(() => Promise.resolve())
      target.assignExperimentIdToTags = jest.fn(() => [])
      target.tagService.batchCreateTags = jest.fn()

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.update = jest.fn(() => Promise.resolve({}))
      target.tagService.deleteTagsForExperimentId = jest.fn(() => Promise.resolve())
      target.assignExperimentIdToTags = jest.fn(() => [{}])
      target.tagService.batchCreateTags = jest.fn(() => Promise.reject())

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{}])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], testContext, testTx)
      })
    })

    it('rejects when deleteTagsForExperimentId fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.update = jest.fn(() => Promise.resolve({}))
      target.tagService.deleteTagsForExperimentId = jest.fn(() => Promise.reject())
      target.assignExperimentIdToTags = jest.fn()
      target.tagService.batchCreateTags = jest.fn()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
      })
    })

    it('throws an error when returned updated data is undefined', () => {
      const target = new ExperimentsService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.update = jest.fn(() => Promise.resolve(undefined))
      target.tagService.deleteTagsForExperimentId = jest.fn()
      target.assignExperimentIdToTags = jest.fn()
      target.tagService.batchCreateTags = jest.fn()
      AppError.notFound = jest.fn()

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      db.experiments.update = jest.fn(() => Promise.reject())
      target.tagService.deleteTagsForExperimentId = jest.fn()
      target.assignExperimentIdToTags = jest.fn()
      target.tagService.batchCreateTags = jest.fn()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.tagService.deleteTagsForExperimentId).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = jest.fn(() => Promise.reject())
      db.experiments.update = jest.fn(() => Promise.reject())
      target.tagService.deleteTagsForExperimentId = jest.fn()
      target.assignExperimentIdToTags = jest.fn()
      target.tagService.batchCreateTags = jest.fn()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).not.toHaveBeenCalled()
        expect(target.tagService.deleteTagsForExperimentId).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
      })
    })
  })

  describe('deleteExperiment', () => {
    it('returns data when successfully deleted data', () => {
      const target = new ExperimentsService()
      db.experiments.remove = jest.fn(() => Promise.resolve({}))

      return target.deleteExperiment(1).then((data) => {
        expect(db.experiments.remove).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data is undefined', () => {
      const target = new ExperimentsService()
      db.experiments.remove = jest.fn(() => Promise.resolve(undefined))
      AppError.notFound = jest.fn()

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
      target.validator.validate = jest.fn(() => Promise.resolve())
      target.toLowerCaseArray = jest.fn(() => [])
      db.experiments.findExperimentsByTags = jest.fn(() => Promise.resolve())

      return target.getExperimentsByFilters('').then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).toHaveBeenCalledTimes(2)
        expect(db.experiments.findExperimentsByTags).toHaveBeenCalledWith([],[])
      })
    })

    it('rejects when findExperimentsByTags fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = jest.fn(() => Promise.resolve())
      target.toLowerCaseArray = jest.fn(() => [])
      db.experiments.findExperimentsByTags = jest.fn(() => Promise.reject())

      return target.getExperimentsByFilters('').then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).toHaveBeenCalledTimes(2)
        expect(db.experiments.findExperimentsByTags).toHaveBeenCalledWith([],[])
      })
    })

    it('rejects when validate fails', () => {
      const target = new ExperimentsService()
      target.validator.validate = jest.fn(() => Promise.reject())
      target.toLowerCaseArray = jest.fn()
      db.experiments.findExperimentsByTags = jest.fn()

      return target.getExperimentsByFilters('').then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).not.toHaveBeenCalled()
        expect(db.experiments.findExperimentsByTags).not.toHaveBeenCalled()
      })
    })
  })

  describe('getAllExperiments', () => {
    it('calls database', () => {
      const target = new ExperimentsService()
      db.experiments.all = jest.fn()

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
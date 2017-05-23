import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentsService from '../../src/services/ExperimentsService'
import db from '../../src/db/DbManager'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'

describe('ExperimentsService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new ExperimentsService()
  })

  describe('batchCreateExperiments', () => {
    it('calls validate, batchCreate, batchCreateOwners, assignExperimentIdToTags,' +
      ' batchCreateTags, and createPostResponse', () => {
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockResolve({})
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([{ owners: ['KMCCL '] }], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ owners: ['KMCCL '] }], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([{ owners: ['KMCCL '] }], testContext, testTx)
        expect(target.ownerService.batchCreateOwners).toHaveBeenCalledWith([{
          experimentId: 1,
          userIds: ['KMCCL'],
        }], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{ owners: ['KMCCL '] }])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}])
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
      })
    })

    it('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
      ' not' +
      ' tagService when there are no tags', () => {
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1, owners: ['KMCCL'] }])
      target.assignExperimentIdToTags = mock([])
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1, owners: ['KMCCL'] }])
      })
    })

    it('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
      ' not' +
      ' tagService when tags are undefined', () => {
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1, owners: ['KMCCL'] }])
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1, owners: ['KMCCL'] }])
      })
    })

    it('rejects when batchCreateTags fails', () => {
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockReject('error')
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}])
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreateOwners fails', () => {
      target.validator.validate = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockReject('error')
      AppUtil.createPostResponse = mock()

      return target.batchCreateExperiments([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(target.ownerService.batchCreateOwners).toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreate fails', () => {
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
      target.isFilterRequest = mock(false)
      target.getExperimentsByFilters = mock()
      target.getAllExperiments = mockResolve([{}])
      target.populateOwners = mockResolve(['KMCCL'])
      target.populateTagsForAllExperiments = mock()

      return target.getExperiments('').then(() => {
        expect(target.isFilterRequest).toHaveBeenCalledWith('')
        expect(target.getExperimentsByFilters).not.toHaveBeenCalled()
        expect(target.getAllExperiments).toHaveBeenCalled()
        expect(target.populateTagsForAllExperiments).toHaveBeenCalledWith([{}])
      })
    })

    it('calls getExperimentsByFilters', () => {
      target.isFilterRequest = mock(true)
      target.getExperimentsByFilters = mockResolve()
      target.getAllExperiments = mock()
      target.populateOwners = mockResolve(['KMCCL'])

      return target.getExperiments('').then(() => {
        expect(target.isFilterRequest).toHaveBeenCalledWith('')
        expect(target.getExperimentsByFilters).toHaveBeenCalledWith('')
        expect(target.getAllExperiments).not.toHaveBeenCalled()
      })
    })
  })


  describe('getUserPermissionsForExperiment', () => {
    it('returns user permissions array ignoringCase', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['ak']
      } )
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1,{userId:'AK'}).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns user permissions array when more than one owner exists', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK','ky']
      } )
      const expectedResult = ['write']

      return target.getUserPermissionsForExperiment(1,{userId:'AK'}).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns empty permissions array when user not matched', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['AK']
      } )
      const expectedResult = []

      return target.getUserPermissionsForExperiment(1,{userId:'JN'}).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns empty permissions array when db query returns null', () => {
      target.ownerService.getOwnersByExperimentId = mockResolve(null)
      const expectedResult = []

      return target.getUserPermissionsForExperiment(1,{userId:'JN'}).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

  })

  describe('populateOwners', () => {
    it('returns mapped owners to an experiment', () => {
      target.ownerService.getOwnersByExperimentIds = mockResolve([{
        experiment_id: 1,
        user_ids: ['KMCCL'],
      }, { experiment_id: 2, user_ids: ['test'] }])
      const expectedResult = [{ id: 1, owners: ['KMCCL'] }, { id: 2, owners: ['test'] }]

      return target.populateOwners([{ id: 1 }, { id: 2 }]).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('resolves when no experiments are given', () => {
      target.ownerService.getOwnersByExperimentIds = mock()

      return target.populateOwners([]).then(() => {
        expect(target.ownerService.getOwnersByExperimentIds).not.toHaveBeenCalled()
      })
    })

    it('sets owners to an empty array when there are none for that experiment', () => {
      target.ownerService.getOwnersByExperimentIds = mockResolve([{
        experiment_id: 1,
        user_ids: ['KMCCL'],
      }])
      const expectedResult = [{ id: 1, owners: ['KMCCL'] }, { id: 2, owners: [] }]

      return target.populateOwners([{ id: 1 }, { id: 2 }]).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })
  })

  describe('populateTagsForAllExperiments', () => {
    it('returns mapped tags to an experiment', () => {
      target.tagService.getAllTagsForEntity = mockResolve([{ entityId: 1, tags:[{category:'cat1', value:'val1'}] }, { entityId: 2, tags:[{category:'cat2', value:'val2'}] }])
      const expectedResult = [{
        id: 1,
        tags: [{ name:'cat1', value:'val1' }],
      }, { id: 2, tags: [ { name:'cat2', value:'val2'} ] }]

      return target.populateTagsForAllExperiments([{ id: 1 }, { id: 2 }]).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('returns experiment with empty tags array when no tags found', () => {
      target.tagService.getAllTagsForEntity = mockResolve([{ entityId: 1, tags:[{category:'cat1', value:'val1'}] }, { entityId: 2, tags:[{category:'cat2', value:'val2'}] }])
      const expectedResult = [{
        id: 1,
        tags: [{ name:'cat1', value:'val1' }],
      }, { id: 2, tags: [ { name:'cat2', value:'val2'} ] }]

      return target.populateTagsForAllExperiments([{ id: 1 }, { id: 2 }]).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    it('resolves when no experiments are passed in', () => {
      target.tagService.getAllTagsForEntity = mock()

      return target.populateTagsForAllExperiments([]).then(() => {
        expect(target.tagService.getAllTagsForEntity).not.toHaveBeenCalled()
      })
    })

    it('rejects when getTagsByExperimentIds fails', () => {
      target.tagService.getAllTagsForEntity = mockReject('error')

      return target.populateTagsForAllExperiments([{ id: 1 }]).then(() => {}, (err) => {
        expect(target.tagService.getAllTagsForEntity).toHaveBeenCalledWith('experiment')
        expect(err).toEqual('error')
      })
    })
  })

  describe('prepareTagResponse', () => {

    it('maps category to name to prepare response ', ()=>{

      const result = ExperimentsService.prepareTagResponse([{category:'tagName', value:'tagValue'}])
      expect(result).toEqual([{name:'tagName', value: 'tagValue'}])
    })
  })

  describe('mergeTagsWithExperiments', () => {

    it('merges experiments and entityTags to  return experiments with tags ', ()=>{
      const result = ExperimentsService.mergeTagsWithExperiments([{id:1}], [{entityId:1, tags:[{category:'tagName', value:'tagValue'}]}])
      expect(result).toEqual([{id:1, tags:[{name:'tagName', value: 'tagValue'}]}])
    })

    it('merges experiments and entityTags to  return experiments with empty tags ', ()=>{
      const result = ExperimentsService.mergeTagsWithExperiments([{id:2}], [{entityId:1, tags:[{category:'tagName', value:'tagValue'}]}])
      expect(result).toEqual([{id:2, tags:[]}])
    })

  })


  describe('getExperimentById', () => {
    it('calls find, getTagsByExperimentId, and returns data', () => {
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockResolve(['KMCCL'])

      return target.getExperimentById(1, testTx).then((data) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({ tags: [] })
      })
    })

    it('rejects when tagService fails', () => {
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockReject('error')
      target.ownerService.getOwnersByExperimentId = mockResolve(['KMCCL'])

      return target.getExperimentById(1, testTx).then(() => {}, (err) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when ownerService fails', () => {
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockReject('error')

      return target.getExperimentById(1, testTx).then(() => {}, (err) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('throws when find returns undefined', () => {
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
    it('calls validate, update, batchUpdateOwners,' +
      ' batchCreateTags', () => {
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.saveTags = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()

      return target.updateExperiment(1, {owners: ['KMCCL ']}, testContext, testTx).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ owners: ['KMCCL ']}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {owners: ['KMCCL ']}, testContext, testTx)
        expect(target.ownerService.batchUpdateOwners).toHaveBeenCalledWith([{experimentId: 1, userIds: ['KMCCL']}], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{owners: ['KMCCL ']}])
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{}], 1)
        expect(data).toEqual({})
      })
    })

    it('calls validate, update,deleteTagsForExperimentId but not batchCreateTags', () => {
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()

      return target.updateExperiment(1, {}, testContext, testTx).then((data) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{}])
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('rejects when batchCreateTags fails', () => {
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.saveTags = mockReject('error')
      target.ownerService.batchUpdateOwners = mockResolve()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([1], [{}])
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{}], 1)
        expect(err).toEqual('error')
      })
    })


    it('throws an error when returned updated data is undefined', () => {
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve()
      target.assignExperimentIdToTags = mock()
      target.tagService.saveTags = mock()
      AppError.notFound = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, () => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found to Update')
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
      })
    })

    it('rejects when update fails', () => {
      target.validator.validate = mockResolve()
      db.experiments.update = mockReject('error')
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {}, testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      db.experiments.update = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{}], 'PUT', testTx)
        expect(db.experiments.update).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteExperiment', () => {
    it('returns data when successfully deleted data', () => {
      db.experiments.remove = mockResolve({})
      target.tagService.deleteTagsForExperimentId = mockResolve()


      return target.deleteExperiment(1).then((data) => {
        expect(db.experiments.remove).toHaveBeenCalledWith(1)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data is undefined', () => {
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
    it('calls validate and findExperimentByTags and returns empty array', () => {
      target.validator.validate = mockResolve()
      target.toLowerCaseArray = mock([])
      target.tagService.getEntityTagsByTagFilters = mockResolve([])
      db.experiments.batchFind = mockResolve()
      ExperimentsService.mergeTagsWithExperiments = mock([])


      return target.getExperimentsByFilters('').then((result) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect( target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '')
        expect(result).toEqual([])
      })
    })

    it('calls validate , findExperimentByTags, batchFind and mergeTagsWithExperiments', () => {
      target.validator.validate = mockResolve()
      ExperimentsService.mergeTagsWithExperiments = mock([])
      target.tagService.getEntityTagsByTagFilters = mockResolve([{entityId:1, tags:[]}])
      db.experiments.batchFind = mockResolve([{experimentId:1}])
      ExperimentsService.mergeTagsWithExperiments = mock([])


      return target.getExperimentsByFilters('').then((result) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '')
        expect(db.experiments.batchFind).toHaveBeenCalledWith([1])
        expect(ExperimentsService.mergeTagsWithExperiments ).toHaveBeenCalledWith([{experimentId:1}], [{entityId:1, tags:[]}])


      })
    })

    it('rejects when findExperimentsByTags fails', () => {
      target.validator.validate = mockResolve()
      target.toLowerCaseArray = mock([])
      target.tagService.getEntityTagsByTagFilters = mockReject('error')
      db.experiments.batchFind = mockResolve()


      return target.getExperimentsByFilters('').then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '')
        expect(db.experiments.batchFind).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
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
      db.experiments.all = mock()

      target.getAllExperiments()
      expect(db.experiments.all).toHaveBeenCalled()
    })
  })

  describe('assignExperimentIdToTags', () => {
    it('returns empty array when no experimentIds are passed in', () => {
      expect(target.assignExperimentIdToTags([], [])).toEqual([])
    })

    it('assigns experiment Id to experiment tags', () => {
      const experimentIds = [1]
      const experiments = [{ id: 1, tags: [{}] }]

      expect(target.assignExperimentIdToTags(experimentIds, experiments)).toEqual([{
        experimentId: 1,
        name: undefined,
        value: undefined,
      }])
    })

    it('assigns name, value, and experimentId to tags', () => {
      const experimentIds = [1]
      const experiments = [{ id: 1, tags: [{ name: 'testN', value: 'testV' }] }]

      expect(target.assignExperimentIdToTags(experimentIds, experiments)).toEqual([{
        experimentId: 1,
        name: 'testn',
        value: 'testv',
      }])
    })

    it('returns an empty array when tags are undefined', () => {
      const experimentIds = [1]
      const experiments = [{ id: 1 }]

      expect(target.assignExperimentIdToTags(experimentIds, experiments)).toEqual([])
    })
  })

  describe('isFilterRequest', () => {
    it('returns true when queryString is supplied and contains allowed filters', () => {
      expect(target.isFilterRequest({ 'tags.name': 'test', 'tags.value': 'test' })).toEqual(true)
    })

    it('returns false when queryString is empty', () => {
      expect(target.isFilterRequest()).toEqual(false)
    })

    it('returns false when no matching parameters are supplied', () => {
      expect(target.isFilterRequest({ 'test': 'test' })).toEqual(false)
    })

    it('returns true even when extra parameters are supplied', () => {
      expect(target.isFilterRequest({
        'tags.name': 'test',
        'tags.value': 'test',
        'test': 'test',
      })).toEqual(true)
    })
  })

})
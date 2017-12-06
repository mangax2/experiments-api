import { mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentsService from '../../src/services/ExperimentsService'
import db from '../../src/db/DbManager'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import CapacityRequestService from '../../src/services/CapacityRequestService'

describe('ExperimentsService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new ExperimentsService()
  })

  describe('batchCreateExperiments', () => {
    let originalFunction
    beforeAll(() => {
      originalFunction = CapacityRequestService.batchAssociateExperimentsToCapacityRequests
    })

    it('calls validate, batchCreate, batchCreateOwners, assignExperimentIdToTags,' +
      ' batchCreateTags, and createPostResponse', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockResolve({})
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([{
        owners: ['KMCCL '],
        ownerGroups: ['group1 '],
      }], testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
        }], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
        }], testContext, testTx)
        expect(target.ownerService.batchCreateOwners).toHaveBeenCalledWith([{
          experimentId: 1,
          userIds: ['KMCCL'],
          groupIds: ['group1'],
        }], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
        }])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], {}, false)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
      })
    })

    it('calls validate, batchCreate, batchCreateOwners, assignExperimentIdToTags,' +
      ' batchCreateTags, and createPostResponse Will  Call ValidateAssociatedRequests and' +
      ' validate the template objects' +
      ' and' +
      ' not batchAssociateExperimentsToCapacityRequests ', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mock()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockResolve({})
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()
      AppError.badRequest = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([{
        owners: ['KMCCL '],
        ownerGroups: ['group1 '],
        request: { id: 1, type: 'field' },
      }], testContext, true, testTx).catch(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          request: { 'id': 1, 'type': 'field' },
        }], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '], request: { 'id': 1, 'type': 'field' },
        }], testContext, testTx)
        expect(target.ownerService.batchCreateOwners).toHaveBeenCalledWith([{
          experimentId: 1,
          userIds: ['KMCCL'],
          groupIds: ['group1'],
        }], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '], 'request': { 'id': 1, 'type': 'field' },
        }])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], {}, false)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
        expect(target.validateAssociatedRequests).toHaveBeenCalled()
        expect(CapacityRequestService.batchAssociateExperimentsToCapacityRequests).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Template(s) cannot be associated to a request')
      })
    })

    it('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
      ' not' +
      ' tagService when there are no tags', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1, owners: ['KMCCL'] }])
      target.assignExperimentIdToTags = mock([])
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1, owners: ['KMCCL'] }])
      })
    })

    it('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
      ' not' +
      ' tagService when tags are undefined', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1, owners: ['KMCCL'] }])
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1, owners: ['KMCCL'] }])
      })
    })

    it('rejects when batchCreateTags fails', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockReject('error')
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], {}, false)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when batchCreateOwners fails', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockReject('error')
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
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
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockReject('error')
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
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
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    afterAll(() => {
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = originalFunction
    })
  })

  describe('validateAssociatedRequests', () => {
    it('resolves if the experiments have no associated requests', (done) => {
      const target = new ExperimentsService()

      target.validateAssociatedRequests([{}], false).then(() => {
        done()
      })
    })

    it('resolves if the experiments have associated requests that are completely filled out', (done) => {
      const target = new ExperimentsService()

      target.validateAssociatedRequests([{ request: { id: 1, type: 'ce' } }], false).then(() => {
        done()
      })
    })

    it('resolves if the experiments have associated requests with only an id', (done) => {
      const target = new ExperimentsService()

      target.validateAssociatedRequests([{ request: { id: 1 } }], false).catch(() => {
        done()
      })
    })

    it('resolves if the experiments have associated requests with only a type', (done) => {
      const target = new ExperimentsService()

      target.validateAssociatedRequests([{ request: { type: 'ce' } }], false).catch(() => {
        done()
      })
    })

    it('rejects if the templates have associated requests ', (done) => {
      const target = new ExperimentsService()
      AppError.badRequest = mock()

      target.validateAssociatedRequests([{ request: { type: 'ce' } }], true).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Template(s) cannot be associated to a request')
        done()
      })
    })

    it('resolves if the templates have associated requests ', (done) => {
      const target = new ExperimentsService()
      AppError.badRequest = mock()

      target.validateAssociatedRequests([], true).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalledWith('Template(s) cannot be associated to' +
          ' a request')
        done()
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

      return target.getExperiments('', false).then(() => {
        expect(target.isFilterRequest).toHaveBeenCalledWith('')
        expect(target.getExperimentsByFilters).not.toHaveBeenCalled()
        expect(target.getAllExperiments).toHaveBeenCalled()
        expect(target.populateTagsForAllExperiments).toHaveBeenCalledWith([{}], false)
      })
    })

    it('calls getExperimentsByFilters', () => {
      target.isFilterRequest = mock(true)
      target.getExperimentsByFilters = mockResolve()
      target.getAllExperiments = mock()
      target.populateOwners = mockResolve(['KMCCL'])

      return target.getExperiments('', false, testContext).then(() => {
        expect(target.isFilterRequest).toHaveBeenCalledWith('')
        expect(target.getExperimentsByFilters).toHaveBeenCalledWith('', false, testContext)
        expect(target.getAllExperiments).not.toHaveBeenCalled()
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
      target.tagService.getAllTagsForEntity = mockResolve([{
        entityId: 1,
        tags: [{ category: 'cat1', value: 'val1' }],
      }, { entityId: 2, tags: [{ category: 'cat2', value: 'val2' }] }])
      const expectedResult = [{
        id: 1,
        tags: [{ category: 'cat1', value: 'val1' }],
      }, { id: 2, tags: [{ category: 'cat2', value: 'val2' }] }]

      return target.populateTagsForAllExperiments([{ id: 1 }, { id: 2 }], false).then((data) => {
        expect(data).toEqual(expectedResult)
        expect(target.tagService.getAllTagsForEntity).toHaveBeenCalledWith('experiment')
      })
    })
    it('returns mapped tags to an template when isTemplate is true ', () => {
      target.tagService.getAllTagsForEntity = mockResolve([{
        entityId: 1,
        tags: [{ category: 'cat1', value: 'val1' }],
      }, { entityId: 2, tags: [{ category: 'cat2', value: 'val2' }] }])
      const expectedResult = [{
        id: 1,
        tags: [{ category: 'cat1', value: 'val1' }],
      }, { id: 2, tags: [{ category: 'cat2', value: 'val2' }] }]

      return target.populateTagsForAllExperiments([{ id: 1 }, { id: 2 }], true).then((data) => {
        expect(data).toEqual(expectedResult)
        expect(target.tagService.getAllTagsForEntity).toHaveBeenCalledWith('template')
      })
    })

    it('returns experiment with empty tags array when no tags found', () => {
      target.tagService.getAllTagsForEntity = mockResolve([{
        entityId: 1,
        tags: [{ category: 'cat1', value: 'val1' }],
      }, { entityId: 2, tags: [{ category: 'cat2', value: 'val2' }] }])
      const expectedResult = [{
        id: 1,
        tags: [{ category: 'cat1', value: 'val1' }],
      }, { id: 2, tags: [{ category: 'cat2', value: 'val2' }] }]

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

    it('maps category to name to prepare response ', () => {

      const result = ExperimentsService.prepareTagResponse([{
        category: 'tagName',
        value: 'tagValue',
      }])
      expect(result).toEqual([{ category: 'tagName', value: 'tagValue' }])
    })
  })

  describe('mergeTagsWithExperiments', () => {

    it('merges experiments and entityTags to  return experiments with tags ', () => {
      const result = ExperimentsService.mergeTagsWithExperiments([{ id: 1 }], [{
        entityId: 1,
        tags: [{ category: 'tagName', value: 'tagValue' }],
      }])
      expect(result).toEqual([{ id: 1, tags: [{ category: 'tagName', value: 'tagValue' }] }])
    })

    it('merges experiments and entityTags to  return experiments with empty tags ', () => {
      const result = ExperimentsService.mergeTagsWithExperiments([{ id: 2 }], [{
        entityId: 1,
        tags: [{ category: 'tagName', value: 'tagValue' }],
      }])
      expect(result).toEqual([{ id: 2, tags: [] }])
    })

  })

  describe('verifyExperimentExists', () => {
    it('resolves when experiment is found', () => {
      db.experiments.find = mockResolve({})
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, false, {}, testTx).then((data) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).not.toHaveBeenCalled()
      })
    })

    it('rejects when experiment is not found', () => {
      db.experiments.find = mockResolve()
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, false, {}, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experimentId')
      })
    })

    it('rejects when template is not found', () => {
      db.experiments.find = mockResolve()
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, true, {}, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, true, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found for requested templateId')
      })
    })
  })

  describe('getExperimentById', () => {
    it('calls find, getTagsByExperimentId, and returns data', () => {
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockResolve(['KMCCL'])

      return target.getExperimentById(1, false, testContext, testTx).then((data) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(data).toEqual({ tags: [] })
      })
    })

    it('rejects when tagService fails', () => {
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockReject('error')
      target.ownerService.getOwnersByExperimentId = mockResolve(['KMCCL'])

      return target.getExperimentById(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('rejects when ownerService fails', () => {
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockReject('error')

      return target.getExperimentById(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual('error')
      })
    })

    it('throws when find returns undefined', () => {
      db.experiments.find = mockResolve()
      target.tagService.getTagsByExperimentId = mock()
      AppError.notFound = mock()

      return target.getExperimentById(1, false, testContext, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested' +
          ' experimentId')
        expect(target.tagService.getTagsByExperimentId).not.toHaveBeenCalled()
      })
    })

    it('throws when find returns undefined for a template ', () => {
      db.experiments.find = mockResolve()
      target.tagService.getTagsByExperimentId = mock()
      AppError.notFound = mock()

      return target.getExperimentById(1, true, testContext, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, true, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found for requested' +
          ' templateId')
        expect(target.tagService.getTagsByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('updateExperiment', () => {
    it('calls validate, update, batchUpdateOwners,' +
      ' batchCreateTags', () => {
      target.validator.validate = mockResolve()
      target.securityService.permissionsCheck = mockResolve()
      db.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.saveTags = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()

      return target.updateExperiment(1, {
        owners: ['KMCCL '],
        ownerGroups: ['group1'],

      }, testContext, false, testTx).then((data) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
          owners: ['KMCCL '],
          ownerGroups: ['group1'],
        }], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {
          id: 1,
          isTemplate: false,
          owners: ['KMCCL '],
          ownerGroups: ['group1'],
        }, testContext, testTx)
        expect(target.ownerService.batchUpdateOwners).toHaveBeenCalledWith([{
          experimentId: 1,
          userIds: ['KMCCL'],
          groupIds: ['group1'],
        }], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
          owners: ['KMCCL '],
          ownerGroups: ['group1'],
        }])
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{}], 1, {}, false)
        expect(data).toEqual({})
      })
    })

    it('calls validate, update,deleteTagsForExperimentId but not batchCreateTags', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then((data) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
        }], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {
          id: 1,
          isTemplate: false,
        }, testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
        }])
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1, {}, false)
        expect(data).toEqual({})
      })
    })

    it('rejects when batchCreateTags fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.saveTags = mockReject('error')
      target.ownerService.batchUpdateOwners = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
        }], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, {
          id: 1,
          isTemplate: false,
        }, testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
        }])
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{}], 1, {}, false)
        expect(err).toEqual('error')
      })
    })

    it('throws an error when returned updated data is undefined', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve()
      target.assignExperimentIdToTags = mock()
      target.tagService.saveTags = mock()
      AppError.notFound = mock()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, { isTemplate: false }, testContext, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found to Update for id')
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
      })
    })

    it('throws an error when returned updated data is undefined for a template ', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve()
      target.assignExperimentIdToTags = mock()
      target.tagService.saveTags = mock()
      AppError.notFound = mock()

      return target.updateExperiment(1, {}, testContext, true, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, true, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: true }], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, { isTemplate: true }, testContext, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found to Update for id')
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
      })
    })

    it('rejects when update fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      db.experiments.update = mockReject('error')
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, { isTemplate: false }, testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockReject('error')
      db.experiments.update = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT', testTx)
        expect(db.experiments.update).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })
  })

  describe('deleteExperiment', () => {
    it('returns data when successfully deleted data', () => {
      target.securityService.permissionsCheck = mockResolve()
      db.experiments.remove = mockResolve({})
      target.tagService.deleteTagsForExperimentId = mockResolve()

      return target.deleteExperiment(1, testContext, false, testTx).then((data) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(db.experiments.remove).toHaveBeenCalledWith(1, false)
        expect(target.tagService.deleteTagsForExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual({})
      })
    })

    it('throws an error when data is undefined', () => {
      db.experiments.remove = mockResolve()
      AppError.notFound = mock()
      target.securityService.permissionsCheck = mockResolve()

      return target.deleteExperiment(1, testContext, false, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(db.experiments.remove).toHaveBeenCalledWith(1, false)
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

      return target.getExperimentsByFilters('', false, testContext).then((result) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '', false, testContext)
        expect(result).toEqual([])
      })
    })

    it('calls validate , findExperimentByTags, batchFind and mergeTagsWithExperiments', () => {
      target.validator.validate = mockResolve()
      ExperimentsService.mergeTagsWithExperiments = mock([])
      target.tagService.getEntityTagsByTagFilters = mockResolve([{ entityId: 1, tags: [] }])
      db.experiments.batchFindExperimentOrTemplate = mockResolve([{ experimentId: 1 }])
      ExperimentsService.mergeTagsWithExperiments = mock([])

      return target.getExperimentsByFilters('', false, testContext).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '', false, testContext)
        expect(db.experiments.batchFindExperimentOrTemplate).toHaveBeenCalledWith([1], false)
        expect(ExperimentsService.mergeTagsWithExperiments).toHaveBeenCalledWith([{ experimentId: 1 }], [{
          entityId: 1,
          tags: [],
        }])
      })
    })

    it('rejects when findExperimentsByTags fails', () => {
      target.validator.validate = mockResolve()
      target.toLowerCaseArray = mock([])
      target.tagService.getEntityTagsByTagFilters = mockReject('error')
      db.experiments.batchFind = mockResolve()

      return target.getExperimentsByFilters('', false, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '', false, testContext)
        expect(db.experiments.batchFind).not.toHaveBeenCalled()
        expect(err).toEqual('error')
      })
    })

    it('rejects when validate fails', () => {
      target.validator.validate = mockReject('error')
      target.toLowerCaseArray = mock()

      return target.getExperimentsByFilters('').then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).not.toHaveBeenCalled()
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
      const experiments = [{ id: 1, tags: [{}] }]

      expect(target.assignExperimentIdToTags(experiments)).toEqual([{
        experimentId: 1,
        name: undefined,
        value: undefined,
      }])
    })

    it('assigns category, value, and experimentId to tags', () => {
      const experiments = [{ id: 1, tags: [{ category: 'testN', value: 'testV' }] }]

      expect(target.assignExperimentIdToTags(experiments)).toEqual([{
        experimentId: 1,
        category: 'testn',
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

  describe('Experiments Manage', () => {
    it('manage Experiments when there is no query parameter in the post end point', () => {
      const requestBody = {}
      target.batchCreateExperiments = mockResolve()
      return target.manageExperiments(requestBody, {}, testContext, testTx).then(() => {
        expect(target.batchCreateExperiments).toHaveBeenCalled()

      })
    })
    it('manage Experiments when there is an inavlid query parameter in the post end point', () => {
      const requestBody = {}
      AppError.badRequest = mock()
      return target.manageExperiments(requestBody, { source: 'fgsdhfhsdf' }, testContext, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Source Type')

      })
    })

    it('manage Experiments when there is  query parameter source is experiment', () => {
      const requestBody = { ids: [1], numberOfCopies: 1 }
      target.copyEntities = mockResolve()
      return target.manageExperiments(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith([1], 1, testContext, false, testTx)

      })
    })

    it('manage experiment when there is  query parameter source is template when if the' +
      ' numberOfCopies is not defined default to 1', () => {
      const requestBody = { id: 1 }
      target.createEntity = mockResolve([{ id: 2 }])
      target.tagService.saveTags = mockResolve()
      target.getExperimentById = mockResolve({tags:[{category:"a",value:"b"}]})
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, false, testTx)
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{category:"a",value:"b", experimentId: 2},{
          category: 'FROM TEMPLATE',
          value: '1',
          experimentId: 2,
        }], 2, testContext, false)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 2 }])

      })
    })

    it('manage experiment when there is  query parameter source is template when if the' +
      'Rejects if the Create Entity service return invalid Data', () => {
      const requestBody = { id: 1 }
      target.createEntity = mockResolve({})
      target.tagService.saveTags = mockResolve()
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).catch((error) => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, false, testTx)
        expect(target.tagService.saveTags).not.toHaveBeenCalledWith([{
          category: 'FROM TEMPLATE',
          value: '2',
          experimentId: 2,
        }], 2, testContext)
        expect(error).toBe('Create Experiment From Template Failed')
        expect(AppUtil.createPostResponse).not.toHaveBeenCalledWith([{ id: 2 }])

      })
    })

    it('manage Experiment when there is  query parameter source is template', () => {
      const requestBody = { id: 1, numberOfCopies: 1 }
      target.createEntity = mockResolve([{ id: 1 }])
      target.tagService.saveTags = mockResolve()
      target.getExperimentById = mockResolve({tags:[{category:"a",value:"b"}]})
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, false, testTx)
        expect(target.tagService.saveTags).toHaveBeenCalled()

      })
    })

    it('CopyExperiments', () => {
      target.generateEntities = mockResolve()
      return target.copyEntities([1, 2], 1, testContext, false, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1, 2], 1, testContext, false, 'copy', testTx)
      })
    })

    it('generateExperiments', () => {
      target.duplicationService.duplicateExperiments = mockResolve()
      return target.generateEntities([1, 2], 1, testContext, false, 'copy', testTx).then(() => {
        expect(target.duplicationService.duplicateExperiments).toHaveBeenCalledWith({
          ids: [1, 2],
          isTemplate: false,
          numberOfCopies: 1,
        }, testContext, 'copy', testTx)
      })
    })
    it('createExperiments from Template', () => {
      target.generateEntities = mockResolve()
      return target.createEntity(1, 1, testContext, false, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, testContext, false, 'conversion', testTx)
      })
    })

    it('Throw Validations when the templateId or numberofCopies is not a number ', () => {
      AppError.badRequest = mock()
      return target.createEntity('test', '2', testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Template Id or number of' +
          ' Copies')

      })
    })

    it('Throw Validations when the ids is not array during Copy Experiments ', () => {
      AppError.badRequest = mock()
      return target.copyEntities('test', '2', testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('ids must be an array')

      })
    })

    it('Throw Validations when the ids is not a numeric array during Copy Experiments ', () => {
      AppError.badRequest = mock()
      return target.copyEntities([1, 2, '3'], '2', testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid ids or number of Copies')
      })
    })

  })

  describe('Templates', () => {
    it('manage Templates when there is no query parameter in the post end point', () => {
      const requestBody = {}
      target.batchCreateTemplates = mockResolve()
      return target.manageTemplates(requestBody, {}, testContext, testTx).then(() => {
        expect(target.batchCreateTemplates).toHaveBeenCalled()

      })
    })
    it('manage Templates when there is an inavlid query parameter in the post end point', () => {
      const requestBody = {}
      AppError.badRequest = mock()
      return target.manageTemplates(requestBody, { source: 'fgsdhfhsdf' }, testContext, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Source Type')

      })
    })

    it('manage Templates when there is  query parameter source is experiment', () => {
      const requestBody = { id: 1, numberOfCopies: 1 }
      target.createEntity = mockResolve()
      return target.manageTemplates(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, true, testTx)

      })
    })

    it('manage Templates when there is  query parameter source is experiment when if the' +
      ' numberOfCopies is no defined default to 1', () => {
      const requestBody = { id: 1 }
      target.createEntity = mockResolve()
      return target.manageTemplates(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, true, testTx)

      })
    })

    it('manage Templates when there is  query parameter source is template', () => {
      const requestBody = { ids: [1], numberOfCopies: 1 }
      target.copyEntities = mockResolve()
      return target.manageTemplates(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith([1], 1, testContext, true, testTx)

      })
    })

    it('batchCreateTemplates', () => {
      const templates = [{ name: 'test' }]
      target.batchCreateExperiments = mockResolve()

      return target.batchCreateTemplates(templates, testContext, testTx).then(() => {
        expect(target.batchCreateExperiments).toHaveBeenCalledWith([{
          name: 'test',
          isTemplate: true,
        }], testContext, true, testTx)
      })
    })

    it('CopyTemplates', () => {
      target.generateEntities = mockResolve()
      return target.copyEntities([1, 2], 1, testContext, true, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1, 2], 1, testContext, true, 'copy', testTx)
      })
    })

    it('generateTemplates', () => {
      target.duplicationService.duplicateExperiments = mockResolve()
      return target.generateEntities([1, 2], 1, testContext, true, 'copy', testTx).then(() => {
        expect(target.duplicationService.duplicateExperiments).toHaveBeenCalledWith({
          ids: [1, 2],
          isTemplate: true,
          numberOfCopies: 1,
        }, testContext, 'copy', testTx)
      })
    })
    it('createTemplates from experiment', () => {
      target.generateEntities = mockResolve()
      return target.createEntity(1, 1, testContext, true, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, testContext, true, 'conversion', testTx)
      })
    })

    it('Throw Validations when the experimentId or numberofCopies is not a number ', () => {
      AppError.badRequest = mock()
      return target.createEntity('test', '2', testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Experiment Id or number of' +
          ' Copies')

      })
    })

    it('Throw Validations when the ids is not array during Copy Templates ', () => {
      AppError.badRequest = mock()
      return target.copyEntities('test', '2', testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('ids must be an array')

      })
    })

    it('Throw Validations when the ids is not a numeric array during Copy Templates ', () => {
      AppError.badRequest = mock()
      return target.copyEntities([1, 2, '3'], '2', testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid ids or number of Copies')
      })
    })

  })

})
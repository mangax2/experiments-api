import { kafkaProducerMocker, mock, mockReject, mockResolve } from '../jestUtil'
import ExperimentsService from '../../src/services/ExperimentsService'
import db from '../../src/db/DbManager'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import CapacityRequestService from '../../src/services/CapacityRequestService'

describe('ExperimentsService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }
  kafkaProducerMocker()

  beforeEach(() => {
    target = new ExperimentsService()
  })

  describe('batchCreateExperiments', () => {
    let originalFunction
    beforeAll(() => {
      originalFunction = CapacityRequestService.batchAssociateExperimentsToCapacityRequests
    })

    test('calls validate, batchCreate, batchCreateOwners, assignExperimentIdToTags,' +
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

    test('calls validate, batchCreate, batchCreateOwners, assignExperimentIdToTags,' +
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
          request: { id: 1, type: 'field' },
        }], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          request: { id: 1, type: 'field' },
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
          request: { id: 1, type: 'field' },
        }])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], {}, false)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
        expect(target.validateAssociatedRequests).toHaveBeenCalled()
        expect(CapacityRequestService.batchAssociateExperimentsToCapacityRequests).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Template(s) cannot be associated to a request')
      })
    })

    test('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
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

    test('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
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

    test('rejects when batchCreateTags fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockReject(error)
      target.ownerService.batchCreateOwners = mockResolve({})
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], {}, false)
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when batchCreateOwners fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockReject(error)
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST', testTx)
        expect(db.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(target.ownerService.batchCreateOwners).toHaveBeenCalled()
        expect(AppUtil.createPostResponse).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      db.experiments.batchCreate = mockReject(error)
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
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
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
        expect(err).toEqual(error)
      })
    })

    afterAll(() => {
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = originalFunction
    })
  })

  describe('validateAssociatedRequests', () => {
    test('resolves if the experiments have no associated requests', (done) => {
      target = new ExperimentsService()

      target.validateAssociatedRequests([{}], false).then(() => {
        done()
      })
    })

    test('resolves if the experiments have associated requests that are completely filled out', (done) => {
      target = new ExperimentsService()

      target.validateAssociatedRequests([{ request: { id: 1, type: 'ce' } }], false).then(() => {
        done()
      })
    })

    test('resolves if the experiments have associated requests with only an id', (done) => {
      target = new ExperimentsService()

      target.validateAssociatedRequests([{ request: { id: 1 } }], false).catch(() => {
        done()
      })
    })

    test('resolves if the experiments have associated requests with only a type', (done) => {
      target = new ExperimentsService()

      target.validateAssociatedRequests([{ request: { type: 'ce' } }], false).catch(() => {
        done()
      })
    })

    test('rejects if the templates have associated requests ', (done) => {
      target = new ExperimentsService()
      AppError.badRequest = mock()

      target.validateAssociatedRequests([{ request: { type: 'ce' } }], true).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Template(s) cannot be associated to a request', undefined, '153002')
        done()
      })
    })

    test('resolves if the templates have associated requests ', (done) => {
      target = new ExperimentsService()
      AppError.badRequest = mock()

      target.validateAssociatedRequests([], true).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalledWith('Template(s) cannot be associated to a request')
        done()
      })
    })
  })

  describe('getExperiments', () => {
    test('calls getAllExperiments', () => {
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

    test('calls getExperimentsByFilters', () => {
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
    test('returns mapped owners to an experiment', () => {
      target.ownerService.getOwnersByExperimentIds = mockResolve([{
        experiment_id: 1,
        user_ids: ['KMCCL'],
      }, { experiment_id: 2, user_ids: ['test'] }])
      const expectedResult = [{ id: 1, owners: ['KMCCL'] }, { id: 2, owners: ['test'] }]

      return target.populateOwners([{ id: 1 }, { id: 2 }]).then((data) => {
        expect(data).toEqual(expectedResult)
      })
    })

    test('resolves when no experiments are given', () => {
      target.ownerService.getOwnersByExperimentIds = mock()

      return target.populateOwners([]).then(() => {
        expect(target.ownerService.getOwnersByExperimentIds).not.toHaveBeenCalled()
      })
    })

    test('sets owners to an empty array when there are none for that experiment', () => {
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
    test('returns mapped tags to an experiment', () => {
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
    test('returns mapped tags to an template when isTemplate is true ', () => {
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

    test('returns experiment with empty tags array when no tags found', () => {
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

    test('resolves when no experiments are passed in', () => {
      target.tagService.getAllTagsForEntity = mock()

      return target.populateTagsForAllExperiments([]).then(() => {
        expect(target.tagService.getAllTagsForEntity).not.toHaveBeenCalled()
      })
    })

    test('rejects when getTagsByExperimentIds fails', () => {
      const error = { message: 'error' }
      target.tagService.getAllTagsForEntity = mockReject(error)

      return target.populateTagsForAllExperiments([{ id: 1 }]).then(() => {}, (err) => {
        expect(target.tagService.getAllTagsForEntity).toHaveBeenCalledWith('experiment')
        expect(err).toEqual(error)
      })
    })
  })

  describe('prepareTagResponse', () => {
    test('maps category to name to prepare response ', () => {
      const result = ExperimentsService.prepareTagResponse([{
        category: 'tagName',
        value: 'tagValue',
      }])
      expect(result).toEqual([{ category: 'tagName', value: 'tagValue' }])
    })
  })

  describe('mergeTagsWithExperiments', () => {
    test('merges experiments and entityTags to  return experiments with tags ', () => {
      const result = ExperimentsService.mergeTagsWithExperiments([{ id: 1 }], [{
        entityId: 1,
        tags: [{ category: 'tagName', value: 'tagValue' }],
      }])
      expect(result).toEqual([{ id: 1, tags: [{ category: 'tagName', value: 'tagValue' }] }])
    })

    test('merges experiments and entityTags to  return experiments with empty tags ', () => {
      const result = ExperimentsService.mergeTagsWithExperiments([{ id: 2 }], [{
        entityId: 1,
        tags: [{ category: 'tagName', value: 'tagValue' }],
      }])
      expect(result).toEqual([{ id: 2, tags: [] }])
    })
  })

  describe('verifyExperimentExists', () => {
    test('resolves when experiment is found', () => {
      db.experiments.find = mockResolve({})
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, false, {}, testTx).then(() => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).not.toHaveBeenCalled()
      })
    })

    test('rejects when experiment is not found', () => {
      db.experiments.find = mockResolve()
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, false, {}, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experimentId', undefined, '157001')
      })
    })

    test('rejects when template is not found', () => {
      db.experiments.find = mockResolve()
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, true, {}, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, true, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found for requested templateId', undefined, '157001')
      })
    })
  })

  describe('getExperimentById', () => {
    test('calls find, getTagsByExperimentId, and returns data', () => {
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

    test('rejects when tagService fails', () => {
      const error = { message: 'error' }
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockReject(error)
      target.ownerService.getOwnersByExperimentId = mockResolve(['KMCCL'])

      return target.getExperimentById(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('rejects when ownerService fails', () => {
      const error = { message: 'error' }
      db.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockReject(error)

      return target.getExperimentById(1, false, testContext, testTx).then(() => {}, (err) => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1, testTx)
        expect(err).toEqual(error)
      })
    })

    test('throws when find returns undefined', () => {
      db.experiments.find = mockResolve()
      target.tagService.getTagsByExperimentId = mock()
      AppError.notFound = mock()

      return target.getExperimentById(1, false, testContext, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experimentId', undefined, '158001')
        expect(target.tagService.getTagsByExperimentId).not.toHaveBeenCalled()
      })
    })

    test('throws when find returns undefined for a template ', () => {
      db.experiments.find = mockResolve()
      target.tagService.getTagsByExperimentId = mock()
      AppError.notFound = mock()

      return target.getExperimentById(1, true, testContext, testTx).then(() => {}, () => {
        expect(db.experiments.find).toHaveBeenCalledWith(1, true, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found for requested templateId', undefined, '158001')
        expect(target.tagService.getTagsByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('updateExperiment', () => {
    test('calls validate, update, batchUpdateOwners,' +
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

    test('calls validate, update,deleteTagsForExperimentId but not batchCreateTags', () => {
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

    test('rejects when batchCreateTags fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      db.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.saveTags = mockReject(error)
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
        expect(err).toEqual(error)
      })
    })

    test('throws an error when returned updated data is undefined', () => {
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
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found to Update for id', undefined, '159001')
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
      })
    })

    test('throws an error when returned updated data is undefined for a template ', () => {
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
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found to Update for id', undefined, '159001')
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
      })
    })

    test('rejects when update fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      db.experiments.update = mockReject(error)
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT', testTx)
        expect(db.experiments.update).toHaveBeenCalledWith(1, { isTemplate: false }, testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockReject(error)
      db.experiments.update = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT', testTx)
        expect(db.experiments.update).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('deleteExperiment', () => {
    test('returns data when successfully deleted data', () => {
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

    test('throws an error when data is undefined', () => {
      db.experiments.remove = mockResolve()
      AppError.notFound = mock()
      target.securityService.permissionsCheck = mockResolve()

      return target.deleteExperiment(1, testContext, false, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false, testTx)
        expect(db.experiments.remove).toHaveBeenCalledWith(1, false)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experimentId', undefined, '15A001')
      })
    })
  })

  describe('getExperimentsByFilters', () => {
    test('calls validate and findExperimentByTags and returns empty array', () => {
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

    test('calls validate , findExperimentByTags, batchFind and mergeTagsWithExperiments', () => {
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

    test('rejects when findExperimentsByTags fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      target.toLowerCaseArray = mock([])
      target.tagService.getEntityTagsByTagFilters = mockReject(error)
      db.experiments.batchFind = mockResolve()

      return target.getExperimentsByFilters('', false, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '', false, testContext)
        expect(db.experiments.batchFind).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      target.toLowerCaseArray = mock()

      return target.getExperimentsByFilters('').then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.toLowerCaseArray).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllExperiments', () => {
    test('calls database', () => {
      db.experiments.all = mock()

      target.getAllExperiments()
      expect(db.experiments.all).toHaveBeenCalled()
    })
  })

  describe('assignExperimentIdToTags', () => {
    test('returns empty array when no experimentIds are passed in', () => {
      expect(target.assignExperimentIdToTags([], [])).toEqual([])
    })

    test('assigns experiment Id to experiment tags', () => {
      const experiments = [{ id: 1, tags: [{}] }]

      expect(target.assignExperimentIdToTags(experiments)).toEqual([{
        experimentId: 1,
        name: undefined,
        value: undefined,
      }])
    })

    test('assigns category, value, and experimentId to tags', () => {
      const experiments = [{ id: 1, tags: [{ category: 'testN', value: 'testV' }] }]

      expect(target.assignExperimentIdToTags(experiments)).toEqual([{
        experimentId: 1,
        category: 'testn',
        value: 'testv',
      }])
    })

    test('returns an empty array when tags are undefined', () => {
      const experimentIds = [1]
      const experiments = [{ id: 1 }]

      expect(target.assignExperimentIdToTags(experimentIds, experiments)).toEqual([])
    })
  })

  describe('isFilterRequest', () => {
    test('returns true when queryString is supplied and contains allowed filters', () => {
      expect(target.isFilterRequest({ 'tags.name': 'test', 'tags.value': 'test' })).toEqual(true)
    })

    test('returns false when queryString is empty', () => {
      expect(target.isFilterRequest()).toEqual(false)
    })

    test('returns false when no matching parameters are supplied', () => {
      expect(target.isFilterRequest({ test: 'test' })).toEqual(false)
    })

    test('returns true even when extra parameters are supplied', () => {
      expect(target.isFilterRequest({
        'tags.name': 'test',
        'tags.value': 'test',
        test: 'test',
      })).toEqual(true)
    })
  })

  describe('Experiments Manage', () => {
    test('manage Experiments when there is no query parameter in the post end point', () => {
      const requestBody = {}
      target.batchCreateExperiments = mockResolve()
      return target.manageExperiments(requestBody, {}, testContext, testTx).then(() => {
        expect(target.batchCreateExperiments).toHaveBeenCalled()
      })
    })
    test('manage Experiments when there is an inavlid query parameter in the post end point', () => {
      const requestBody = {}
      AppError.badRequest = mock()
      return target.manageExperiments(requestBody, { source: 'fgsdhfhsdf' }, testContext, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Source Type', undefined, '15F002')
      })
    })

    test('manage Experiments when there is  query parameter source is experiment', () => {
      const requestBody = { ids: [1], numberOfCopies: 1 }
      target.copyEntities = mockResolve()
      return target.manageExperiments(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith([1], 1, testContext, false, testTx)
      })
    })

    test('manage experiment when there is  query parameter source is template when if the' +
      ' numberOfCopies is not defined default to 1', () => {
      const requestBody = { id: 1 }
      target.createEntity = mockResolve([{ id: 2 }])
      target.tagService.saveTags = mockResolve()
      target.getExperimentById = mockResolve({ tags: [{ category: 'a', value: 'b' }] })
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, false, testTx)
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{ category: 'a', value: 'b', experimentId: 2 }, {
          category: 'FROM TEMPLATE',
          value: '1',
          experimentId: 2,
        }], 2, testContext, false)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 2 }])
      })
    })

    test('manage experiment when there is  query parameter source is template when if the' +
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
        expect(error.status).toBe(500)
        expect(error.code).toBe('Internal Server Error')
        expect(AppUtil.createPostResponse).not.toHaveBeenCalledWith([{ id: 2 }])
      })
    })

    test('manage Experiment when there is  query parameter source is template', () => {
      const requestBody = { id: 1, numberOfCopies: 1 }
      target.createEntity = mockResolve([{ id: 1 }])
      target.tagService.saveTags = mockResolve()
      target.getExperimentById = mockResolve({ tags: [{ category: 'a', value: 'b' }] })
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, false, testTx)
        expect(target.tagService.saveTags).toHaveBeenCalled()
      })
    })

    test('CopyExperiments', () => {
      target.generateEntities = mockResolve()
      return target.copyEntities([1, 2], 1, testContext, false, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1, 2], 1, testContext, false, 'copy', testTx)
      })
    })

    test('generateExperiments', () => {
      target.duplicationService.duplicateExperiments = mockResolve()
      return target.generateEntities([1, 2], 1, testContext, false, 'copy', testTx).then(() => {
        expect(target.duplicationService.duplicateExperiments).toHaveBeenCalledWith({
          ids: [1, 2],
          isTemplate: false,
          numberOfCopies: 1,
        }, testContext, 'copy', testTx)
      })
    })
    test('createExperiments from Template', () => {
      target.generateEntities = mockResolve()
      return target.createEntity(1, 1, testContext, false, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, testContext, false, 'conversion', testTx)
      })
    })

    test('Throw Validations when the templateId or numberofCopies is not a number ', () => {
      AppError.badRequest = mock()
      return target.createEntity('test', '2', testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Template Id or number of Copies', undefined, '15H001')
      })
    })

    test('Throw Validations when the ids is not array during Copy Experiments ', () => {
      AppError.badRequest = mock()
      return target.copyEntities('test', '2', testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('ids must be an array', undefined, '15I001')
      })
    })

    test('Throw Validations when the ids is not a numeric array during Copy Experiments ', () => {
      AppError.badRequest = mock()
      return target.copyEntities([1, 2, '3'], '2', testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid ids or number of Copies', undefined, '15I002')
      })
    })
  })

  describe('Templates', () => {
    test('manage Templates when there is no query parameter in the post end point', () => {
      const requestBody = {}
      target.batchCreateTemplates = mockResolve()
      return target.manageTemplates(requestBody, {}, testContext, testTx).then(() => {
        expect(target.batchCreateTemplates).toHaveBeenCalled()
      })
    })
    test('manage Templates when there is an inavlid query parameter in the post end point', () => {
      const requestBody = {}
      AppError.badRequest = mock()
      return target.manageTemplates(requestBody, { source: 'fgsdhfhsdf' }, testContext, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Source Type', undefined, '15G001')
      })
    })

    test('manage Templates when there is  query parameter source is experiment', () => {
      const requestBody = { id: 1, numberOfCopies: 1 }
      target.createEntity = mockResolve()
      return target.manageTemplates(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, true, testTx)
      })
    })

    test('manage Templates when there is  query parameter source is experiment when if the numberOfCopies is no defined default to 1', () => {
      const requestBody = { id: 1 }
      target.createEntity = mockResolve()
      return target.manageTemplates(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, testContext, true, testTx)
      })
    })

    test('manage Templates when there is  query parameter source is template', () => {
      const requestBody = { ids: [1], numberOfCopies: 1 }
      target.copyEntities = mockResolve()
      return target.manageTemplates(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith([1], 1, testContext, true, testTx)
      })
    })

    test('batchCreateTemplates', () => {
      const templates = [{ name: 'test' }]
      target.batchCreateExperiments = mockResolve()

      return target.batchCreateTemplates(templates, testContext, testTx).then(() => {
        expect(target.batchCreateExperiments).toHaveBeenCalledWith([{
          name: 'test',
          isTemplate: true,
        }], testContext, true, testTx)
      })
    })

    test('CopyTemplates', () => {
      target.generateEntities = mockResolve()
      return target.copyEntities([1, 2], 1, testContext, true, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1, 2], 1, testContext, true, 'copy', testTx)
      })
    })

    test('generateTemplates', () => {
      target.duplicationService.duplicateExperiments = mockResolve()
      return target.generateEntities([1, 2], 1, testContext, true, 'copy', testTx).then(() => {
        expect(target.duplicationService.duplicateExperiments).toHaveBeenCalledWith({
          ids: [1, 2],
          isTemplate: true,
          numberOfCopies: 1,
        }, testContext, 'copy', testTx)
      })
    })
    test('createTemplates from experiment', () => {
      target.generateEntities = mockResolve()
      return target.createEntity(1, 1, testContext, true, testTx).then(() => {
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, testContext, true, 'conversion', testTx)
      })
    })

    test('Throw Validations when the experimentId or numberofCopies is not a number ', () => {
      AppError.badRequest = mock()
      return target.createEntity('test', '2', testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Experiment Id or number of Copies', undefined, '15H001')
      })
    })

    test('Throw Validations when the ids is not array during Copy Templates ', () => {
      AppError.badRequest = mock()
      return target.copyEntities('test', '2', testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('ids must be an array', undefined, '15I001')
      })
    })

    test('Throw Validations when the ids is not a numeric array during Copy Templates ', () => {
      AppError.badRequest = mock()
      return target.copyEntities([1, 2, '3'], '2', testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid ids or number of Copies', undefined, '15I002')
      })
    })
  })

  describe('getExperimentsByUser', () => {
    test('calls both security service and experiments repo', () => {
      target.securityService.getGroupsByUserId = mockResolve(['testGroup'])
      db.experiments.findExperimentsByUserIdOrGroup = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByUser(['testUser'], false, testTx).then(() => {
        expect(target.securityService.getGroupsByUserId).toBeCalledWith('testUser')
        expect(db.experiments.findExperimentsByUserIdOrGroup).toBeCalledWith(false, 'testUser', ['testGroup'], testTx)
        expect(AppError.badRequest).not.toBeCalled()
      })
    })

    test('returns a 400 if no user id provided', (done) => {
      target.securityService.getGroupsByUserId = mockResolve(['testGroup'])
      db.experiments.findExperimentsByUserIdOrGroup = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByUser(undefined, false, testTx).catch(() => {
        expect(target.securityService.getGroupsByUserId).not.toBeCalled()
        expect(db.experiments.findExperimentsByUserIdOrGroup).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('No UserId provided.', undefined, '15N001')
        done()
      })
    })

    test('returns a 400 if more than one user id provided', (done) => {
      target.securityService.getGroupsByUserId = mockResolve(['testGroup'])
      db.experiments.findExperimentsByUserIdOrGroup = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByUser(['testUser1', 'testUser2'], false, testTx).catch(() => {
        expect(target.securityService.getGroupsByUserId).not.toBeCalled()
        expect(db.experiments.findExperimentsByUserIdOrGroup).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('Multiple UserIds are not allowed.', undefined, '15N002')
        done()
      })
    })
  })

  describe('getExperimentsByCriteria', () => {
    let originalGetExperimentsByUser

    beforeAll(() => {
      originalGetExperimentsByUser = target.getExperimentsByUser
    })

    afterAll(() => {
      target.getExperimentsByUser = originalGetExperimentsByUser
    })

    test('calls getExperimentsByUser if criteria is owner', () => {
      target.getExperimentsByUser = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByCriteria({ criteria: 'owner', value: 'testUser', isTemplate: true }).then(() => {
        expect(target.getExperimentsByUser).toBeCalledWith('testUser', true)
        expect(AppError.badRequest).not.toBeCalled()
      })
    })

    test('returns a 400 if criteria does not match', (done) => {
      target.getExperimentsByUser = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByCriteria({ criteria: 'badCriteria', value: 'testUser', isTemplate: true }).catch(() => {
        expect(target.getExperimentsByUser).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('Invalid criteria provided', undefined, '15O001')
        done()
      })
    })
  })
})

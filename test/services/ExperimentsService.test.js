import {
  kafkaProducerMocker, mock, mockReject, mockResolve,
} from '../jestUtil'
import ExperimentsService from '../../src/services/ExperimentsService'
import { dbRead, dbWrite } from '../../src/db/DbManager'
import AppUtil from '../../src/services/utility/AppUtil'
import AppError from '../../src/services/utility/AppError'
import CapacityRequestService from '../../src/services/CapacityRequestService'
import OAuthUtil from '../../src/services/utility/OAuthUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'
import apiUrls from '../configs/apiUrls'
import KafkaProducer from '../../src/services/kafka/KafkaProducer'

jest.mock('../../src/services/utility/OAuthUtil')
jest.mock('../../src/services/utility/HttpUtil')

describe('ExperimentsService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {}, batch: promises => Promise.all(promises) }
  kafkaProducerMocker()

  beforeEach(() => {
    target = new ExperimentsService()
    target.securityService = {
      canUserCreateExperiments: mockResolve(true),
    }
    OAuthUtil.getAuthorizationHeaders.mockClear()
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
      dbWrite.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockResolve({})
      target.ownerService.batchCreateOwners = mockResolve({})
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([{
        owners: ['KMCCL '],
        ownerGroups: ['group1 '],
        reviewers: ['group2 '],
      }], testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          reviewers: ['group2 '],
        }], 'POST')
        expect(dbWrite.experiments.batchCreate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          reviewers: ['group2 '],
        }], testContext, testTx)
        expect(target.ownerService.batchCreateOwners).toHaveBeenCalledWith([{
          experimentId: 1,
          userIds: ['KMCCL'],
          groupIds: ['group1'],
          reviewerIds: [],
          reviewerGroupIds: ['group2'],
        }], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          reviewers: ['group2 '],
        }])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], {}, false)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
      })
    })

    test('calls validate, batchCreate, batchCreateOwners, assignExperimentIdToTags,' +
      ' batchCreateTags, and createPostResponse Will  Call ValidateAssociatedRequests and' +
      ' validate the template objects and not batchAssociateExperimentsToCapacityRequests', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      dbWrite.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockResolve({})
      target.ownerService.batchCreateOwners = mockResolve({})
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      AppError.badRequest = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([{
        owners: ['KMCCL '],
        ownerGroups: ['group1 '],
        reviewers: ['group2 '],
        reviewerUsers: ['user1'],
        request: { id: 1, type: 'field' },
      }], testContext, true, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          reviewers: ['group2 '],
          reviewerUsers: ['user1'],
          request: { id: 1, type: 'field' },
        }], 'POST')
        expect(dbWrite.experiments.batchCreate).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          reviewers: ['group2 '],
          reviewerUsers: ['user1'],
          request: { id: 1, type: 'field' },
        }], testContext, testTx)
        expect(target.ownerService.batchCreateOwners).toHaveBeenCalledWith([{
          experimentId: 1,
          userIds: ['KMCCL'],
          groupIds: ['group1'],
          reviewerIds: ['user1'],
          reviewerGroupIds: ['group2'],
        }], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL '],
          ownerGroups: ['group1 '],
          reviewers: ['group2 '],
          reviewerUsers: ['user1'],
          request: { id: 1, type: 'field' },
        }])
        expect(target.tagService.batchCreateTags).toHaveBeenCalledWith([{}], {}, true)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1 }])
        expect(target.validateAssociatedRequests).toHaveBeenCalled()
        expect(CapacityRequestService.batchAssociateExperimentsToCapacityRequests).not.toHaveBeenCalled()
      })
    })

    test('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
      ' not tagService when there are no tags', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      dbWrite.experiments.batchCreate = mockResolve([{ id: 1, owners: ['KMCCL'] }])
      target.assignExperimentIdToTags = mock([])
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1, owners: ['KMCCL'] }])
      })
    })

    test('calls validate, batchCreate, assignExperimentIdToTags, and createPostResponse, but' +
      ' not tagService when tags are undefined', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      dbWrite.experiments.batchCreate = mockResolve([{ id: 1, owners: ['KMCCL'] }])
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([])
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 1, owners: ['KMCCL'] }])
      })
    })

    test('calls validate, batchCreates an analysis model', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      dbWrite.experiments.batchCreate = mockResolve([{
        id: 1,
        owners: ['KMCCL'],
        analysisModelType: 'RCB',
        analysisModelSubType: 'BLUE',
      }])
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      const experiments = [{
        id: 1,
        analysisModelType: 'RCB',
        analysisModelSubType: 'BLUE',
      }]
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments(experiments, testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ analysisModelType: 'RCB', analysisModelSubType: 'BLUE', id: 1 }], 'POST')
        expect(target.analysisModelService.batchCreateAnalysisModel).toHaveBeenCalledWith([{ analysisModelType: 'RCB', analysisModelSubType: 'BLUE', experimentId: 1 }], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL'],
          analysisModelType: 'RCB',
          analysisModelSubType: 'BLUE',
        }])
      })
    })

    test('calls validate, does not create analysis model  when it is external ', () => {
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      dbWrite.experiments.batchCreate = mockResolve([{
        id: 1,
        owners: ['KMCCL'],
      }])
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockResolve({})
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      const experiments = [{
        id: 1,
      }]
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments(experiments, testContext, false, testTx).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ id: 1 }], 'POST')
        expect(target.analysisModelService.batchCreateAnalysisModel).toHaveBeenCalledWith([], testContext, testTx)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{
          id: 1,
          owners: ['KMCCL'],
        }])
      })
    })

    test('rejects when batchCreateTags fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      target.validateAssociatedRequests = mockResolve()
      dbWrite.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mockReject(error)
      target.ownerService.batchCreateOwners = mockResolve({})
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
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
      dbWrite.experiments.batchCreate = mockResolve([{ id: 1 }])
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.batchCreateTags = mock()
      target.ownerService.batchCreateOwners = mockReject(error)
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
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
      dbWrite.experiments.batchCreate = mockReject(error)
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.experiments.batchCreate).toHaveBeenCalledWith([], testContext, testTx)
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
      dbWrite.experiments.batchCreate = mock()
      target.assignExperimentIdToTags = mock()
      target.analysisModelService.batchCreateAnalysisModel = mockResolve({})
      target.tagService.batchCreateTags = mock()
      target.removeInvalidRandomizationConfig = mockResolve()
      AppUtil.createPostResponse = mock()
      CapacityRequestService.batchAssociateExperimentsToCapacityRequests = jest.fn(() => [Promise.resolve()])

      return target.batchCreateExperiments([], testContext, false, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([], 'POST')
        expect(dbWrite.experiments.batchCreate).not.toHaveBeenCalled()
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
    test('resolves if the experiments have no associated requests', () => {
      target = new ExperimentsService()

      expect(target.validateAssociatedRequests([{}], false)).resolves.toBe(undefined)
    })

    test('resolves if the experiments have associated requests that are completely filled out', () => {
      target = new ExperimentsService()

      expect(target.validateAssociatedRequests([{ request: { id: 1, type: 'ce' } }], false)).resolves.toBe(undefined)
    })

    test('rejects if the experiments have associated requests with only an id', () => {
      target = new ExperimentsService()
      AppError.badRequest = mock()

      return target.validateAssociatedRequests([{ request: { id: 1 } }], false).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Each request must have an id and a type.', undefined, '153001')
      })
    })

    test('rejects if the experiments have associated requests with only a type', () => {
      target = new ExperimentsService()
      AppError.badRequest = mock()

      return target.validateAssociatedRequests([{ request: { type: 'ce' } }], false).then(null, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Each request must have an id and a type.', undefined, '153001')
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
      dbRead.experiments.find = mockResolve({})
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, false, {}).then(() => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(AppError.notFound).not.toHaveBeenCalled()
      })
    })

    test('rejects when experiment is not found', () => {
      dbRead.experiments.find = mockResolve()
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, false, {}).then(() => {}, () => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experimentId', undefined, '157001')
      })
    })

    test('rejects when template is not found', () => {
      dbRead.experiments.find = mockResolve()
      AppError.notFound = mock()

      return ExperimentsService.verifyExperimentExists(1, true, {}).then(() => {}, () => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, true)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found for requested templateId', undefined, '157001')
      })
    })
  })

  describe('getExperimentById', () => {
    test('calls find, getTagsByExperimentId, and returns data', () => {
      dbRead.experiments.find = mockResolve({
        status: 'REJECTED',
      })
      dbRead.comment.findRecentByExperimentId = mockResolve({
        description: 'rejected',
      })
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['KMCCL'],
        group_ids: ['cosmos-dev-team'],
        reviewer_group_ids: ['cosmos-admin'],
        reviewer_user_ids: ['user'],
      })
      target.analysisModelService.getAnalysisModelByExperimentId = mockResolve({
        analysis_model_type: 'RCB',
        analysis_model_sub_type: 'BLUE',
      })

      return target.getExperimentById(1, false, testContext).then((data) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.comment.findRecentByExperimentId).toHaveBeenCalled()
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1)
        expect(target.analysisModelService.getAnalysisModelByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual({
          analysisModelType: 'RCB',
          analysisModelSubType: 'BLUE',
          comment: 'rejected',
          ownerGroups: ['cosmos-dev-team'],
          owners: ['KMCCL'],
          reviewers: ['cosmos-admin'],
          reviewerUsers: ['user'],
          status: 'REJECTED',
          tags: [],
        })
      })
    })

    test('calls find, getTagsByExperimentId, and returns data without comment', () => {
      dbRead.experiments.find = mockResolve({
        status: 'REJECTED',
      })
      dbRead.comment.findRecentByExperimentId = mockResolve(undefined)
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockResolve({
        user_ids: ['KMCCL'],
        group_ids: ['cosmos-dev-team'],
        reviewer_group_ids: ['cosmos-admin'],
        reviewer_user_ids: ['user'],
      })
      target.analysisModelService.getAnalysisModelByExperimentId = mockResolve()

      return target.getExperimentById(1, false, testContext).then((data) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(dbRead.comment.findRecentByExperimentId).toHaveBeenCalled()
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1)
        expect(target.analysisModelService.getAnalysisModelByExperimentId).toHaveBeenCalledWith(1)
        expect(data).toEqual(
          {
            ownerGroups: ['cosmos-dev-team'],
            owners: ['KMCCL'],
            reviewers: ['cosmos-admin'],
            reviewerUsers: ['user'],
            status: 'REJECTED',
            tags: [],
          },
        )
      })
    })

    test('rejects when tagService fails', () => {
      const error = { message: 'error' }
      dbRead.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockReject(error)
      target.ownerService.getOwnersByExperimentId = mockResolve(['KMCCL'])
      target.analysisModelService.getAnalysisModelByExperimentId = mockResolve({})

      return target.getExperimentById(1, false, testContext).then(() => {}, (err) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1)
        expect(target.analysisModelService.getAnalysisModelByExperimentId).toHaveBeenCalledWith(1)
        expect(err).toEqual(error)
      })
    })

    test('rejects when ownerService fails', () => {
      const error = { message: 'error' }
      dbRead.experiments.find = mockResolve({})
      target.tagService.getTagsByExperimentId = mockResolve([])
      target.ownerService.getOwnersByExperimentId = mockReject(error)
      target.analysisModelService.getAnalysisModelByExperimentId = mockResolve({})
      return target.getExperimentById(1, false, testContext).then(() => {}, (err) => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(target.tagService.getTagsByExperimentId).toHaveBeenCalledWith(1, false, testContext)
        expect(target.ownerService.getOwnersByExperimentId).toHaveBeenCalledWith(1)
        target.analysisModelService.getAnalysisModelByExperimentId = mockResolve({})
        expect(err).toEqual(error)
      })
    })

    test('throws when find returns undefined', () => {
      dbRead.experiments.find = mockResolve()
      target.tagService.getTagsByExperimentId = mock()
      AppError.notFound = mock()

      return target.getExperimentById(1, false, testContext).then(() => {}, () => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, false)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experimentId', undefined, '15U001')
        expect(target.tagService.getTagsByExperimentId).not.toHaveBeenCalled()
      })
    })

    test('throws when find returns undefined for a template ', () => {
      dbRead.experiments.find = mockResolve()
      target.tagService.getTagsByExperimentId = mock()
      AppError.notFound = mock()

      return target.getExperimentById(1, true, testContext).then(() => {}, () => {
        expect(dbRead.experiments.find).toHaveBeenCalledWith(1, true)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found for requested templateId', undefined, '15U001')
        expect(target.tagService.getTagsByExperimentId).not.toHaveBeenCalled()
      })
    })
  })

  describe('updateExperiment', () => {
    beforeEach(() => {
      dbRead.experiments.find = mockResolve({ name: 'oldName' })
    })

    test('calls validate, update, batchUpdateOwners,' +
      ' batchCreateTags', () => {
      target.validator.validate = mockResolve()
      target.securityService.permissionsCheck = mockResolve()
      dbWrite.experiments.update = mockResolve({
        status: 'REJECTED',
        comment: 'rejection reason',
      })
      dbWrite.comment.batchCreate = mock()
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.saveTags = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.deleteAnalysisModelByExperimentId = mockResolve()

      return target.updateExperiment(1, {
        owners: ['KMCCL'],
        ownerGroups: ['group1'],
        reviewers: ['group2'],
        reviewerUsers: ['user'],
        status: 'REJECTED',
        comment: 'rejection reason',
      }, testContext, false, testTx).then((data) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
          owners: ['KMCCL'],
          ownerGroups: ['group1'],
          reviewers: ['group2'],
          reviewerUsers: ['user'],
          status: 'REJECTED',
          comment: 'rejection reason',

        }], 'PUT')
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, {
          id: 1,
          isTemplate: false,
          owners: ['KMCCL'],
          ownerGroups: ['group1'],
          reviewers: ['group2'],
          reviewerUsers: ['user'],
          status: 'REJECTED',
          comment: 'rejection reason',
        }, testContext, testTx)
        expect(dbWrite.comment.batchCreate).toHaveBeenCalled()
        expect(target.ownerService.batchUpdateOwners).toHaveBeenCalledWith([{
          experimentId: 1,
          userIds: ['KMCCL'],
          groupIds: ['group1'],
          reviewerGroupIds: ['group2'],
          reviewerIds: ['user'],
        }], testContext, testTx)
        expect(target.assignExperimentIdToTags).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
          owners: ['KMCCL'],
          ownerGroups: ['group1'],
          reviewers: ['group2'],
          reviewerUsers: ['user'],
          status: 'REJECTED',
          comment: 'rejection reason',
        }])
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{}], 1, {}, false)
        expect(data).toEqual({ comment: 'rejection reason', status: 'REJECTED' })
      })
    })

    test('calls validate, update,deleteTagsForExperimentId but not batchCreateTags', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.deleteAnalysisModelByExperimentId = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then((data) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
        }], 'PUT')
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, {
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

    test('when analysis model is updated to existing model,record is updated in db', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.getAnalysisModelByExperimentId = mockResolve({
        id: 1,
        analysisModelType: 'RCB',
        analysisModelSubType: 'BLUE',
      })
      target.analysisModelService.batchCreateAnalysisModel = mockResolve()
      const experiment = {
        name: 'test',
        analysisModelType: 'RCB',
        analysisModelSubType: 'BLUP',
      }

      return target.updateExperiment(1, experiment, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalled()
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, {
          analysisModelType: 'RCB',
          analysisModelSubType: 'BLUP',
          id: 1,
          isTemplate: false,
          name: 'test',
        }, testContext, testTx)
        expect(target.analysisModelService.getAnalysisModelByExperimentId).toHaveBeenCalled()
        expect(target.analysisModelService.batchUpdateAnalysisModel).toHaveBeenCalled()
      })
    })

    test('when analysis model is updated from null to existing model,record is inserted in db', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.getAnalysisModelByExperimentId = mockResolve()
      target.analysisModelService.batchCreateAnalysisModel = mockResolve()
      const experiment = {
        name: 'test',
        analysisModelType: 'RCB',
        analysisModelSubType: 'BLUP',
      }

      return target.updateExperiment(1, experiment, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalled()
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, {
          analysisModelType: 'RCB',
          analysisModelSubType: 'BLUP',
          id: 1,
          isTemplate: false,
          name: 'test',
        }, testContext, testTx)
        expect(target.analysisModelService.getAnalysisModelByExperimentId).toHaveBeenCalled()
        expect(target.analysisModelService.batchCreateAnalysisModel).toHaveBeenCalled()
      })
    })

    test('when analysis model is updated to External,record is deleted in db', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.getAnalysisModelByExperimentId = mockResolve()
      target.analysisModelService.deleteAnalysisModelByExperimentId = mockResolve()
      const experiment = {
        name: 'test',
        analysisModelType: null,
        analysisModelSubType: null,
      }

      return target.updateExperiment(1, experiment, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalled()
        expect(dbWrite.experiments.update).toHaveBeenCalled()
        expect(target.analysisModelService.deleteAnalysisModelByExperimentId).toHaveBeenCalled()
      })
    })
    test('rejects when batchCreateTags fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve({})
      target.assignExperimentIdToTags = mock([{}])
      target.tagService.saveTags = mockReject(error)
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.deleteAnalysisModelByExperimentId = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalledWith([{
          id: 1,
          isTemplate: false,
        }], 'PUT')
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, {
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
      dbWrite.experiments.update = mockResolve()
      target.assignExperimentIdToTags = mock()
      target.tagService.saveTags = mock()
      AppError.notFound = mock()
      target.removeInvalidRandomizationConfig = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT')
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, { isTemplate: false }, testContext, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found to Update for id', undefined, '159001')
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
      })
    })

    test('throws an error when returned updated data is undefined for a template ', () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve()
      target.assignExperimentIdToTags = mock()
      target.tagService.saveTags = mock()
      AppError.notFound = mock()
      target.removeInvalidRandomizationConfig = mockResolve()

      return target.updateExperiment(1, {}, testContext, true, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, true)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: true }], 'PUT')
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, { isTemplate: true }, testContext, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Template Not Found to Update for id', undefined, '159001')
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.saveTags).not.toHaveBeenCalled()
      })
    })

    test('rejects when update fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockReject(error)
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.removeInvalidRandomizationConfig = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT')
        expect(dbWrite.experiments.update).toHaveBeenCalledWith(1, { isTemplate: false }, testContext, testTx)
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockReject(error)
      dbWrite.experiments.update = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.removeInvalidRandomizationConfig = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT')
        expect(dbWrite.experiments.update).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('rejects when comment validate fails', () => {
      const error = { message: 'error' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockReject(error)
      dbWrite.comment.update = mock()
      target.assignExperimentIdToTags = mock()
      target.tagService.batchCreateTags = mock()
      target.removeInvalidRandomizationConfig = mockResolve()

      return target.updateExperiment(1, {}, testContext, false, testTx).then(() => {}, (err) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.validator.validate).toHaveBeenCalledWith([{ isTemplate: false }], 'PUT')
        expect(dbWrite.comment.update).not.toHaveBeenCalled()
        expect(target.assignExperimentIdToTags).not.toHaveBeenCalled()
        expect(target.tagService.batchCreateTags).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })

    test('sends kafka notification if name has changed', async () => {
      const newExperiment = { name: 'newName' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve(newExperiment)
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.deleteAnalysisModelByExperimentId = mockResolve()
      KafkaProducer.publish = mock()

      await target.updateExperiment(1, newExperiment, testContext, false, testTx)

      expect(KafkaProducer.publish).toHaveBeenCalled()
    })

    test('does not send kafka notification if name has not changed', async () => {
      const newExperiment = { name: 'oldName' }
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      dbWrite.experiments.update = mockResolve(newExperiment)
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.deleteAnalysisModelByExperimentId = mockResolve()
      KafkaProducer.publish = mock()

      await target.updateExperiment(1, newExperiment, testContext, false, testTx)

      expect(KafkaProducer.publish).not.toHaveBeenCalled()
    })

    test('does not send kafka notification if error occurs while saving', async () => {
      target.securityService.permissionsCheck = mockResolve()
      target.validator.validate = mockResolve()
      target.assignExperimentIdToTags = mock([])
      target.tagService.saveTags = mock()
      target.tagService.deleteTagsForExperimentId = mockResolve()
      target.ownerService.batchUpdateOwners = mockResolve()
      target.analysisModelService.batchUpdateAnalysisModel = mockResolve()
      target.removeInvalidRandomizationConfig = mockResolve()
      target.analysisModelService.deleteAnalysisModelByExperimentId = mockResolve()
      const newExperiment = { name: 'newName' }
      KafkaProducer.publish = mock()
      dbWrite.experiments.update = mockReject()
      let errorThrown = false

      try {
        await target.updateExperiment(1, newExperiment, testContext, false, testTx)
      } catch {
        errorThrown = true
      }

      expect(errorThrown).toBe(true)
      expect(KafkaProducer.publish).not.toHaveBeenCalled()
    })
  })

  describe('removeInvalidRandomizationConfig', () => {
    test('calls the factor and designSpecDetails services', async () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve()
      HttpUtil.get = mockResolve({ body: [{ strategyCode: 'rcb' }, { strategyCode: 'crd' }, { strategyCode: 'custom' }] })
      target.factorService = { updateFactorsForDesign: mockResolve() }
      target.designSpecificationDetailService = { deleteInvalidSpecsForRandomization: mockResolve() }

      await target.removeInvalidRandomizationConfig(5, 'crd', testTx)

      expect(target.factorService.updateFactorsForDesign).toBeCalledWith(5, { strategyCode: 'crd' }, testTx)
      expect(target.designSpecificationDetailService.deleteInvalidSpecsForRandomization).toHaveBeenCalledWith(5, { strategyCode: 'crd' }, testTx)
    })
  })

  describe('deleteExperiment', () => {
    test('returns data when successfully deleted data', () => {
      target.securityService.getUserPermissionsForExperiment = mockResolve()
      target.securityService.permissionsCheck = mockResolve(['write'])
      dbWrite.experiments.remove = mockResolve({})
      target.locationAssocWithBlockService.getByExperimentId = mockResolve({})
      const headers = [{ authorization: 'Bearer akldsjf;alksdjf;alksdjf;' }]
      const response = {
        body: {
          id: 198,
          num_internal_sites: 2,
          num_external_sites: 1,
        },
      }
      OAuthUtil.getAuthorizationHeaders = jest.fn(() => Promise.resolve(headers))
      HttpUtil.get = jest.fn(() => Promise.resolve({ body: response.body }))
      HttpUtil.put = jest.fn(() => Promise.resolve({}))
      target.tagService.deleteTagsForExperimentId = mockResolve()
      return target.deleteExperiment(1, testContext, false, testTx).then((data) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(dbWrite.experiments.remove).toHaveBeenCalledWith(1, false, testTx)
        expect(data).toEqual([{}, {}])
      })
    })

    test('rejects and unable to delete experiment when there is an internal server ', () => {
      target.securityService.getUserPermissionsForExperiment = mockResolve()
      target.securityService.permissionsCheck = mockResolve(['write'])
      dbWrite.experiments.remove = mockResolve({})
      target.locationAssocWithBlockService.getByExperimentId = mockResolve({})
      const error = new Error()
      error.status = 500
      error.response = { }
      OAuthUtil.getAuthorizationHeaders = jest.fn(() => Promise.reject(error))
      AppError.badRequest = mock({})
      target.tagService.deleteTagsForExperimentId = mockResolve()
      return target.deleteExperiment(1, testContext, false, testTx).catch(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(dbWrite.experiments.remove).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.badRequest).toHaveBeenCalled()
      })
    })
    test(' unable to delete experiment when experiment is not found', () => {
      target.securityService.getUserPermissionsForExperiment = mockResolve()
      target.securityService.permissionsCheck = mockResolve(['write'])
      dbWrite.experiments.remove = mockResolve({})
      target.locationAssocWithBlockService.getByExperimentId = mockResolve({})
      const error = new Error()
      error.status = 404
      error.response = { text: '' }
      OAuthUtil.getAuthorizationHeaders = jest.fn(() => Promise.reject(error))
      AppError.badRequest = mock({})
      target.tagService.deleteTagsForExperimentId = mockResolve()
      return target.deleteExperiment(1, testContext, false, testTx).then(() => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(dbWrite.experiments.remove).toHaveBeenCalledWith(1, false, testTx)
        expect(target.locationAssocWithBlockService.getByExperimentId).toHaveBeenCalled()
        expect(AppError.badRequest).not.toHaveBeenCalled()
      })
    })
    test('returns data when successfully deleted experiment from the capacity request', () => {
      target.securityService.getUserPermissionsForExperiment = mockResolve()
      target.securityService.permissionsCheck = mockResolve(['write'])
      dbWrite.experiments.remove = mockResolve({})
      target.locationAssocWithBlockService.getByExperimentId = mockResolve({})
      const headers = [{ authorization: 'Bearer akldsjf;alksdjf;alksdjf;' }]
      const response = undefined
      target.tagService.deleteTagsForExperimentId = mockResolve()
      OAuthUtil.getAuthorizationHeaders = jest.fn(() => Promise.resolve(headers))
      HttpUtil.get = jest.fn(() => Promise.resolve(response))
      HttpUtil.put = jest.fn(() => Promise.resolve({}))
      return target.deleteExperiment(1, testContext, false, testTx).then((data) => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(dbWrite.experiments.remove).toHaveBeenCalledWith(1, false, testTx)
        expect(data).toEqual([undefined, {}])
      })
    })
    test('throws an error  when user do not have write permission ', () => {
      target.securityService.getUserPermissionsForExperiment = mockResolve()
      target.securityService.permissionsCheck = mockResolve(['review'])
      AppError.unauthorized = mock()
      return target.deleteExperiment(1, testContext, false, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(AppError.unauthorized).toHaveBeenCalled()
      })
    })
    test('throws an error  when experiment is associated to a set', () => {
      target.securityService.getUserPermissionsForExperiment = mockResolve()
      target.securityService.permissionsCheck = mockResolve(['write'])
      target.locationAssocWithBlockService.getByExperimentId = mockResolve([{ experiment_id: 1842, location: 1, set_id: 9888909 }])
      AppError.badRequest = mock()

      return target.deleteExperiment(1, testContext, false, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(target.locationAssocWithBlockService.getByExperimentId).toHaveBeenCalledWith(1)
        expect(AppError.badRequest).toHaveBeenCalled()
      })
    })

    test('throws an error when data is undefined', () => {
      dbWrite.experiments.remove = mockResolve()
      target.securityService.permissionsCheck = mockResolve(['write'])
      target.locationAssocWithBlockService.getByExperimentId = mockResolve({})
      AppError.notFound = mock()

      return target.deleteExperiment(1, testContext, false, testTx).then(() => {}, () => {
        expect(target.securityService.permissionsCheck).toHaveBeenCalledWith(1, testContext, false)
        expect(dbWrite.experiments.remove).toHaveBeenCalledWith(1, false, testTx)
        expect(AppError.notFound).toHaveBeenCalledWith('Experiment Not Found for requested experimentId', undefined, '15A001')
      })
    })
  })

  describe('getExperimentsByFilters', () => {
    test('calls validate and findExperimentByTags and returns empty array', () => {
      target.validator.validate = mockResolve()
      target.toLowerCaseArray = mock([])
      target.tagService.getEntityTagsByTagFilters = mockResolve([])
      dbRead.experiments.batchFind = mockResolve()
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
      dbRead.experiments.batchFindExperimentOrTemplate = mockResolve([{ experimentId: 1 }])
      ExperimentsService.mergeTagsWithExperiments = mock([])

      return target.getExperimentsByFilters('', false, testContext).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '', false, testContext)
        expect(dbRead.experiments.batchFindExperimentOrTemplate).toHaveBeenCalledWith([1], false)
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
      dbRead.experiments.batchFind = mockResolve()

      return target.getExperimentsByFilters('', false, testContext).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([''], 'FILTER')
        expect(target.tagService.getEntityTagsByTagFilters).toHaveBeenCalledWith('', '', false, testContext)
        expect(dbRead.experiments.batchFind).not.toHaveBeenCalled()
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
      dbRead.experiments.all = mock()

      target.getAllExperiments()
      expect(dbRead.experiments.all).toHaveBeenCalled()
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

    test('manage Experiments when there is an invalid query parameter in the post end point', () => {
      const requestBody = {}
      AppError.badRequest = mock()
      return target.manageExperiments(requestBody, { source: 'fgsdhfhsdf' }, testContext, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Source Type', undefined, '15F002')
      })
    })

    test('manage Experiments when there is query parameter source is experiment', () => {
      const requestBody = { ids: [1], numberOfCopies: 1 }
      target.copyEntities = mockResolve()
      return target.manageExperiments(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith([1], 1, undefined, testContext, false, testTx)
      })
    })

    test('manage Experiments when query parameter source is experiment and there is no ids property in requestProperty', () => {
      const requestBody = { ids: null, id: 42, numberOfCopies: 1 }
      target.copyEntities = mockResolve()
      return target.manageExperiments(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith(42, 1, undefined, testContext, false, testTx)
      })
    })

    test('manage experiment when there is query parameter source is template when if the' +
      ' numberOfCopies is not defined default to 1', () => {
      const requestBody = { id: 1, name: 'newName' }
      target.createEntity = mockResolve([{ id: 2 }])
      target.tagService.saveTags = mockResolve()
      target.tagService.getTagsByExperimentId = mockResolve([{ category: 'a', value: 'b' }])
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, 'newName', testContext, false, testTx)
        expect(target.tagService.saveTags).toHaveBeenCalledWith([{ category: 'a', value: 'b', experimentId: 2 }, {
          category: 'FROM TEMPLATE',
          value: '1',
          experimentId: 2,
        }], 2, testContext, false)
        expect(AppUtil.createPostResponse).toHaveBeenCalledWith([{ id: 2 }])
      })
    })

    test('manage experiment when there is query parameter source is template when if the' +
      'Rejects if the Create Entity service return invalid Data', () => {
      const requestBody = { id: 1 }
      target.createEntity = mockResolve({})
      target.tagService.saveTags = mockResolve()
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).catch((error) => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, undefined, testContext, false, testTx)
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

    test('manage Experiment when there is query parameter source is template', () => {
      const requestBody = { id: 1, name: 'newName', numberOfCopies: 1 }
      target.createEntity = mockResolve([{ id: 1 }])
      target.tagService.saveTags = mockResolve()
      target.tagService.getTagsByExperimentId = mockResolve([{ category: 'a', value: 'b' }])
      AppUtil.createPostResponse = mockResolve({})
      return target.manageExperiments(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, 'newName', testContext, false, testTx)
        expect(target.tagService.saveTags).toHaveBeenCalled()
      })
    })

    test('fails with a forbidden if the user is not allowed to create experiments', () => {
      target.securityService.canUserCreateExperiments = mockResolve(false)
      AppError.forbidden = mock()

      return target.manageExperiments({}, {}, testContext, testTx).catch(() => {
        expect(target.securityService.canUserCreateExperiments).toHaveBeenCalledWith(testContext)
        expect(AppError.forbidden).toHaveBeenCalledWith('The user is not allowed to create experiments.', undefined, '15F003')
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

    test('manage Templates when there is query parameter source is experiment', () => {
      const requestBody = { id: 1, numberOfCopies: 1, name: 'newName' }
      target.createEntity = mockResolve()
      return target.manageTemplates(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, 'newName', testContext, true, testTx)
      })
    })

    test('manage Templates when there is query parameter source is experiment when if the numberOfCopies is no defined default to 1', () => {
      const requestBody = { id: 1 }
      target.createEntity = mockResolve()
      return target.manageTemplates(requestBody, { source: 'experiment' }, testContext, testTx).then(() => {
        expect(target.createEntity).toHaveBeenCalledWith(1, 1, undefined, testContext, true, testTx)
      })
    })

    test('manage Templates when there is query parameter source is template', () => {
      const requestBody = { ids: [1], numberOfCopies: 1, name: 'newName' }
      target.copyEntities = mockResolve()
      return target.manageTemplates(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith([1], 1, 'newName', testContext, true, testTx)
      })
    })

    test('manage Experiments when query parameter source is template and there is no ids property in requestProperty', () => {
      const requestBody = { ids: null, id: 42, numberOfCopies: 1 }
      target.copyEntities = mockResolve()
      return target.manageTemplates(requestBody, { source: 'template' }, testContext, testTx).then(() => {
        expect(target.copyEntities).toHaveBeenCalledWith(42, 1, undefined, testContext, true, testTx)
      })
    })

    test('fails with a forbidden if the user is not allowed to create templates', () => {
      target.securityService.canUserCreateExperiments = mockResolve(false)
      AppError.forbidden = mock()

      return target.manageTemplates({}, {}, testContext, testTx).catch(() => {
        expect(target.securityService.canUserCreateExperiments).toHaveBeenCalledWith(testContext)
        expect(AppError.forbidden).toHaveBeenCalledWith('The user is not allowed to create templates.', undefined, '15G002')
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
  })

  describe('validateExperimentName', () => {
    test('does nothing when name is undefined', () => {
      AppError.badRequest = mock()

      target.validateExperimentName(undefined)

      expect(AppError.badRequest).not.toHaveBeenCalled()
    })

    test('does nothing when name is a string less than or equal to 100 characters', () => {
      AppError.badRequest = mock()

      target.validateExperimentName('test name')

      expect(AppError.badRequest).not.toHaveBeenCalled()
    })

    test('throws an exception if the name is a string over 100 characters', () => {
      AppError.badRequest = mock()

      expect(() => target.validateExperimentName(Array(101).fill('a').join())).toThrow()

      expect(AppError.badRequest).toHaveBeenCalledWith('Experiment or template names cannot be longer than 100 characters', undefined, '15V001')
    })
  })

  describe('copyEntities', () => {
    test('CopyExperiments', () => {
      target.generateEntities = mockResolve()
      target.validateExperimentName = mock()
      return target.copyEntities([1], 1, 'newName', testContext, false, testTx).then(() => {
        expect(target.validateExperimentName).toHaveBeenCalledWith('newName')
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, 'newName', testContext, false, 'copy', testTx)
      })
    })

    test('Throw Validations when the id is not numeric during Copy Experiments ', () => {
      AppError.badRequest = mock()
      target.validateExperimentName = mock()
      return target.copyEntities('3', '2', undefined, testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid id or number of Copies', undefined, '15I002')
      })
    })

    test('Throws when multiple ids are provided while copying experiments', () => {
      AppError.badRequest = mock()
      target.validateExperimentName = mock()
      return target.copyEntities([1, 2], '2', undefined, testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Only one experiment or template may be copied at a time', undefined, '15I001')
      })
    })

    test('Handles `ids` being passed as a single number', () => {
      target.generateEntities = mockResolve()
      target.validateExperimentName = mock()
      return target.copyEntities(1, 1, 'newName', testContext, false, testTx).then(() => {
        expect(target.validateExperimentName).toHaveBeenCalledWith('newName')
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, 'newName', testContext, false, 'copy', testTx)
      })
    })

    test('CopyTemplates', () => {
      target.generateEntities = mockResolve()
      target.validateExperimentName = mock()
      return target.copyEntities([1], 1, undefined, testContext, true, testTx).then(() => {
        expect(target.validateExperimentName).toHaveBeenCalledWith(undefined)
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, undefined, testContext, true, 'copy', testTx)
      })
    })

    test('Throw Validations when the id is not numeric during Copy Templates ', () => {
      AppError.badRequest = mock()
      target.validateExperimentName = mock()
      return target.copyEntities('3', '2', undefined, testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid id or number of Copies', undefined, '15I002')
      })
    })

    test('Throws when multiple ids are provided while copying templates', () => {
      AppError.badRequest = mock()
      target.validateExperimentName = mock()
      return target.copyEntities([1, 2], '2', undefined, testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Only one experiment or template may be copied at a time', undefined, '15I001')
      })
    })
  })

  describe('createEntity', () => {
    test('createExperiments from Template', () => {
      target.generateEntities = mockResolve()
      target.validateExperimentName = mock()
      return target.createEntity(1, 1, 'newName', testContext, false, testTx).then(() => {
        expect(target.validateExperimentName).toHaveBeenCalledWith('newName')
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, 'newName', testContext, false, 'conversion', testTx)
      })
    })

    test('Throw Validations when the templateId or numberofCopies is not a number ', () => {
      AppError.badRequest = mock()
      target.validateExperimentName = mock()
      return target.createEntity('test', '2', undefined, testContext, false, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Template Id or number of Copies', undefined, '15H001')
      })
    })

    test('createTemplates from experiment', () => {
      target.generateEntities = mockResolve()
      target.validateExperimentName = mock()
      return target.createEntity(1, 1, undefined, testContext, true, testTx).then(() => {
        expect(target.validateExperimentName).toHaveBeenCalledWith(undefined)
        expect(target.generateEntities).toHaveBeenCalledWith([1], 1, undefined, testContext, true, 'conversion', testTx)
      })
    })

    test('Throw Validations when the experimentId or numberofCopies is not a number ', () => {
      AppError.badRequest = mock()
      target.validateExperimentName = mock()
      return target.createEntity('test', '2', undefined, testContext, true, testTx).catch(() => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid Experiment Id or number of Copies', undefined, '15H001')
      })
    })
  })

  describe('generateEntities', () => {
    test('generateExperiments', () => {
      target.duplicationService.duplicateExperiments = mockResolve()
      return target.generateEntities([2], 1, 'newName', testContext, false, 'copy', testTx).then(() => {
        expect(target.duplicationService.duplicateExperiments).toHaveBeenCalledWith({
          ids: [2],
          isTemplate: false,
          numberOfCopies: 1,
          name: 'newName',
        }, testContext, 'copy', testTx)
      })
    })

    test('generateTemplates', () => {
      target.duplicationService.duplicateExperiments = mockResolve()
      return target.generateEntities([2], 1, undefined, testContext, true, 'copy', testTx).then(() => {
        expect(target.duplicationService.duplicateExperiments).toHaveBeenCalledWith({
          ids: [2],
          isTemplate: true,
          numberOfCopies: 1,
        }, testContext, 'copy', testTx)
      })
    })
  })

  describe('getExperimentsByUser', () => {
    test('calls both security service and experiments repo', () => {
      target.securityService.getGroupsByUserId = mockResolve(['testGroup'])
      dbRead.experiments.findExperimentsByUserIdOrGroup = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByUser(['testUser'], false).then(() => {
        expect(target.securityService.getGroupsByUserId).toBeCalledWith('testUser')
        expect(dbRead.experiments.findExperimentsByUserIdOrGroup).toBeCalledWith(false, 'testUser', ['testGroup'])
        expect(AppError.badRequest).not.toBeCalled()
      })
    })

    test('returns a 400 if no user id provided', (done) => {
      target.securityService.getGroupsByUserId = mockResolve(['testGroup'])
      dbRead.experiments.findExperimentsByUserIdOrGroup = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByUser(undefined, false).catch(() => {
        expect(target.securityService.getGroupsByUserId).not.toBeCalled()
        expect(dbRead.experiments.findExperimentsByUserIdOrGroup).not.toBeCalled()
        expect(AppError.badRequest).toBeCalledWith('No UserId provided.', undefined, '15N001')
        done()
      })
    })

    test('returns a 400 if more than one user id provided', (done) => {
      target.securityService.getGroupsByUserId = mockResolve(['testGroup'])
      dbRead.experiments.findExperimentsByUserIdOrGroup = mockResolve()
      AppError.badRequest = mock()

      return target.getExperimentsByUser(['testUser1', 'testUser2'], false).catch(() => {
        expect(target.securityService.getGroupsByUserId).not.toBeCalled()
        expect(dbRead.experiments.findExperimentsByUserIdOrGroup).not.toBeCalled()
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

  describe('handleReviewStatus', () => {
    test('throws an error when status is not provided', () => {
      AppError.badRequest = mock()
      return target.handleReviewStatus(1, false, {}, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Status must be provided in body. Acceptable options are: DRAFT,SUBMITTED,APPROVED,REJECTED', null, '15P001')
      })
    })

    test('rejects when provided status is not valid', () => {
      AppError.badRequest = mock()
      return target.handleReviewStatus(1, false, { status: 'BAD' }, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Invalid status provided. Acceptable options are: DRAFT,SUBMITTED,APPROVED,REJECTED', null, '15P003')
      })
    })

    test('calls cancel review when provided status is DRAFT', () => {
      target.cancelReview = mockResolve()
      return target.handleReviewStatus(1, false, { status: 'DRAFT' }, testContext, testTx).then(() => {
        expect(target.cancelReview).toHaveBeenCalledWith(1, false, testContext, testTx)
      })
    })

    test('rejects when status is SUBMITTED and timestamp is not present in body for experiment', () => {
      AppError.badRequest = mock()
      return target.handleReviewStatus(1, false, { status: 'SUBMITTED' }, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('The timestamp field must be provided in body for submitting an experiment', null, '15P002')
      })
    })

    test('rejects when status is SUBMITTED and timestamp is not present in body for template', () => {
      AppError.badRequest = mock()
      return target.handleReviewStatus(1, true, { status: 'SUBMITTED' }, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('The timestamp field must be provided in body for submitting a template', null, '15P002')
      })
    })

    test('calls submitForReview when status is SUBMITTED and timestamp was provided', () => {
      target.submitForReview = mockResolve()
      return target.handleReviewStatus(1, false, { status: 'SUBMITTED', timestamp: '123' }, testContext, testTx).then(() => {
        expect(target.submitForReview).toHaveBeenCalledWith(1, false, '123', testContext, testTx)
      })
    })

    test('calls cancel review when provided status is APPROVED with no comment', () => {
      target.submitReview = mockResolve()
      return target.handleReviewStatus(1, false, { status: 'APPROVED' }, testContext, testTx).then(() => {
        expect(target.submitReview).toHaveBeenCalledWith(1, false, 'APPROVED', undefined, testContext, testTx)
      })
    })

    test('calls cancel review when provided status is REJECTED with a comment', () => {
      target.submitReview = mockResolve()
      return target.handleReviewStatus(1, false, { status: 'APPROVED', comment: 'test comment' }, testContext, testTx).then(() => {
        expect(target.submitReview).toHaveBeenCalledWith(1, false, 'APPROVED', 'test comment', testContext, testTx)
      })
    })
  })

  describe('submitForReview', () => {
    test('rejects when experiment has a task id', () => {
      AppError.badRequest = mock()
      target.getExperimentById = mockResolve({ task_id: '1' })
      target.securityService.permissionsCheck = mockResolve()

      return target.submitForReview(1, false, '123', testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment has already been submitted for review. To submit a new review, please cancel the existing review.', null, '15Q001')
      })
    })

    test('rejects when template has a task id', () => {
      AppError.badRequest = mock()
      target.getExperimentById = mockResolve({ task_id: '1' })
      target.securityService.permissionsCheck = mockResolve()

      return target.submitForReview(1, true, '123', testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Template has already been submitted for review. To submit a new review, please cancel the existing review.', null, '15Q001')
      })
    })

    test('rejects when experiment does not have reviewers assigned', () => {
      AppError.badRequest = mock()
      target.getExperimentById = mockResolve({ reviewers: [], reviewerUsers: [] })
      target.securityService.permissionsCheck = mockResolve()

      return target.submitForReview(1, false, '123', testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('No reviewers have been assigned to this experiment', null, '15Q002')
      })
    })

    test('rejects when template does not have reviewers assigned', () => {
      AppError.badRequest = mock()
      target.getExperimentById = mockResolve({ reviewers: [], reviewerUsers: [] })
      target.securityService.permissionsCheck = mockResolve()

      return target.submitForReview(1, true, '123', testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('No reviewers have been assigned to this template', null, '15Q002')
      })
    })

    test('rejects when date is invalid', () => {
      AppError.badRequest = mock()
      target.getExperimentById = mockResolve({ reviewers: ['REVIEWER'] })
      target.securityService.permissionsCheck = mockResolve()

      return target.submitForReview(1, false, 'abc', testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('The timestamp field is an invalid date string', null, '15Q003')
      })
    })

    test('rejects when date is less than current date', () => {
      AppError.badRequest = mock()
      target.getExperimentById = mockResolve({ reviewers: ['REVIEWER'] })
      target.securityService.permissionsCheck = mockResolve()

      return target.submitForReview(1, false, '1970-01-01T00:00:00.000Z', testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Provided date must be greater than current date', null, '15Q004')
      })
    })

    test('creates a task and updates experiment status when everything is valid', () => {
      target.getExperimentById = mockResolve({ reviewers: ['REVIEWER'], reviewerUsers: [], name: 'EXP NAME' })
      target.securityService.permissionsCheck = mockResolve()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      dbWrite.experiments.updateExperimentStatus = mockResolve()

      const date = new Date()
      date.setFullYear(date.getFullYear() + 1)

      const expectedTaskTemplate = {
        title: 'Experiment "EXP NAME" Review Requested',
        body: {
          text: 'Experiment "EXP NAME" is ready for statistician review.',
        },
        userGroups: ['REVIEWER'],
        actions: [
          {
            title: 'Review Experiment "EXP NAME"',
            url: 'https://dev.velocity-np.ag/experiments/1',
          },
        ],
        tags: [
          'experiment-review-request',
        ],
        dueDate: date.toISOString().slice(0, date.toISOString().indexOf('T')),
        tagKey: `1|${date.toISOString().slice(0, date.toISOString().indexOf('T'))}`,
      }

      return target.submitForReview(1, false, date.toISOString(), testContext, testTx).then(() => {
        expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith('https://messaging.velocity-np.ag/v5/tasks', [], expectedTaskTemplate)
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalledWith(1, 'SUBMITTED', 123, testContext, testTx)
      })
    })

    test('creates a task and updates experiment status when a reviewer is provided', async () => {
      target.getExperimentById = mockResolve({ reviewers: [], reviewerUsers: ['REVIEWER'], name: 'EXP NAME' })
      target.securityService.permissionsCheck = mockResolve()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      dbWrite.experiments.updateExperimentStatus = mockResolve()

      const date = new Date()
      date.setFullYear(date.getFullYear() + 1)

      const expectedTaskTemplate = {
        title: 'Experiment "EXP NAME" Review Requested',
        body: {
          text: 'Experiment "EXP NAME" is ready for statistician review.',
        },
        recipients: ['REVIEWER'],
        actions: [
          {
            title: 'Review Experiment "EXP NAME"',
            url: 'https://dev.velocity-np.ag/experiments/1',
          },
        ],
        tags: [
          'experiment-review-request',
        ],
        dueDate: date.toISOString().slice(0, date.toISOString().indexOf('T')),
        tagKey: `1|${date.toISOString().slice(0, date.toISOString().indexOf('T'))}`,
      }

      await target.submitForReview(1, false, date.toISOString(), testContext, testTx)
      expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
      expect(HttpUtil.post).toHaveBeenCalledWith('https://messaging.velocity-np.ag/v5/tasks', [], expectedTaskTemplate)
      expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalledWith(1, 'SUBMITTED', 123, testContext, testTx)
    })

    test('creates a task and updates experiment status when everything is valid for a template', () => {
      target.getExperimentById = mockResolve({ reviewers: ['REVIEWER'], reviewerUsers: [], name: 'TEMPLATE NAME' })
      target.securityService.permissionsCheck = mockResolve()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: 123 } }))
      dbWrite.experiments.updateExperimentStatus = mockResolve()

      const date = new Date()
      date.setFullYear(date.getFullYear() + 1)

      const expectedTaskTemplate = {
        title: 'Template "TEMPLATE NAME" Review Requested',
        body: {
          text: 'Template "TEMPLATE NAME" is ready for statistician review.',
        },
        userGroups: ['REVIEWER'],
        actions: [
          {
            title: 'Review Template "TEMPLATE NAME"',
            url: 'https://dev.velocity-np.ag/experiments/templates/1',
          },
        ],
        tags: [
          'experiment-review-request',
        ],
        dueDate: date.toISOString().slice(0, date.toISOString().indexOf('T')),
        tagKey: `1|${date.toISOString().slice(0, date.toISOString().indexOf('T'))}`,
      }

      return target.submitForReview(1, true, date.toISOString(), testContext, testTx).then(() => {
        expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith('https://messaging.velocity-np.ag/v5/tasks', [], expectedTaskTemplate)
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalledWith(1, 'SUBMITTED', 123, testContext, testTx)
      })
    })

    test('fails to create a task', () => {
      target.getExperimentById = mockResolve({ reviewers: ['REVIEWER'], reviewerUsers: [], name: 'TEMPLATE NAME' })
      target.securityService.permissionsCheck = mockResolve()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockReturnValueOnce(Promise.reject(new Error('error')))
      dbWrite.experiments.updateExperimentStatus = mockResolve()
      AppError.internalServerError = mock()

      const date = new Date()
      date.setFullYear(date.getFullYear() + 1)

      const expectedTaskTemplate = {
        title: 'Template "TEMPLATE NAME" Review Requested',
        body: {
          text: 'Template "TEMPLATE NAME" is ready for statistician review.',
        },
        userGroups: ['REVIEWER'],
        actions: [
          {
            title: 'Review Template "TEMPLATE NAME"',
            url: 'https://dev.velocity-np.ag/experiments/templates/1',
          },
        ],
        tags: [
          'experiment-review-request',
        ],
        dueDate: date.toISOString().slice(0, date.toISOString().indexOf('T')),
        tagKey: `1|${date.toISOString().slice(0, date.toISOString().indexOf('T'))}`,
      }

      return target.submitForReview(1, true, date.toISOString(), testContext, testTx).then(() => {}, () => {
        expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
        expect(HttpUtil.post).toHaveBeenCalledWith('https://messaging.velocity-np.ag/v5/tasks', [], expectedTaskTemplate)
        expect(dbWrite.experiments.updateExperimentStatus).not.toHaveBeenCalled()
        expect(AppError.internalServerError).toHaveBeenCalledWith('Error encountered contacting the velocity messaging api', 'error', '15Q005')
      })
    })
  })

  describe('submitReview', () => {
    beforeEach(() => {
      target.notifyUsersReviewCompletion = mockResolve()
    })

    test('rejects when submitting user is not a reviewer', () => {
      target.getExperimentById = mockResolve()
      target.securityService.getUserPermissionsForExperiment = mockResolve(['write'])
      AppError.forbidden = mock()

      return target.submitReview(1, false, '', null, testContext, testTx).then(() => {}, () => {
        expect(AppError.forbidden).toHaveBeenCalledWith('Only reviewers are allowed to submit a review', null, '15R001')
      })
    })

    test('rejects when current experiment status is not SUBMITTED', () => {
      target.getExperimentById = mockResolve({ status: 'DRAFT' })
      target.securityService.getUserPermissionsForExperiment = mockResolve(['review'])
      AppError.badRequest = mock()

      return target.submitReview(1, false, '', null, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Experiment has not been submitted for review', null, '15R002')
      })
    })

    test('rejects when current template status is not SUBMITTED', () => {
      target.getExperimentById = mockResolve({ status: 'DRAFT' })
      target.securityService.getUserPermissionsForExperiment = mockResolve(['review'])
      AppError.badRequest = mock()

      return target.submitReview(1, true, '', null, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Template has not been submitted for review', null, '15R002')
      })
    })

    test('rejects when unable to complete task due to messaging api issue', () => {
      target.getExperimentById = mockResolve({ status: 'SUBMITTED', task_id: 123 })
      target.securityService.getUserPermissionsForExperiment = mockResolve(['review'])
      AppError.badRequest = mock()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      const error = new Error('text')
      error.status = 400
      error.response = {
        text: 'error',
      }
      HttpUtil.put.mockReturnValueOnce(Promise.reject(error))

      return target.submitReview(1, true, '', null, testContext, testTx).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to complete task', null, '15R003')
      })
    })

    test('only calls updates to the database when task is null', () => {
      target.getExperimentById = mockResolve({ status: 'SUBMITTED', task_id: null })
      target.securityService.getUserPermissionsForExperiment = mockResolve(['review'])
      dbWrite.experiments.updateExperimentStatus = mockResolve()
      dbWrite.comment.batchCreate = mockResolve()

      return target.submitReview(1, true, '', null, testContext, testTx).then(() => {
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalled()
        expect(dbWrite.comment.batchCreate).toHaveBeenCalled()
        expect(OAuthUtil.getAuthorizationHeaders).not.toHaveBeenCalled()
      })
    })

    test('successfully completes the task and updates experiment status and comment', () => {
      target.getExperimentById = mockResolve({ status: 'SUBMITTED', task_id: 123 })
      target.securityService.getUserPermissionsForExperiment = mockResolve(['review'])
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.put.mockReturnValueOnce(Promise.resolve())
      dbWrite.experiments.updateExperimentStatus = mockResolve()
      dbWrite.comment.batchCreate = mockResolve()

      return target.submitReview(1, true, 'APPROVED', null, testContext, testTx).then(() => {
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalledWith(1, 'APPROVED', null, testContext, testTx)
        expect(dbWrite.comment.batchCreate).toHaveBeenCalledWith([{ description: null, experimentId: 1 }], testContext, testTx)
      })
    })

    test('updates status of experiment and adds comment when task complete call fails but is ignored', () => {
      target.getExperimentById = mockResolve({ status: 'SUBMITTED', task_id: 123 })
      target.securityService.getUserPermissionsForExperiment = mockResolve(['review'])
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      const error = new Error('text')
      error.status = 404
      error.response = {
        text: 'error',
      }
      HttpUtil.put.mockReturnValueOnce(Promise.reject(error))
      dbWrite.experiments.updateExperimentStatus = mockResolve()
      dbWrite.comment.batchCreate = mockResolve()

      return target.submitReview(1, true, 'APPROVED', null, testContext, testTx).then(() => {
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalledWith(1, 'APPROVED', null, testContext, testTx)
        expect(dbWrite.comment.batchCreate).toHaveBeenCalledWith([{ description: null, experimentId: 1 }], testContext, testTx)
      })
    })
  })

  describe('cancelReview', () => {
    test('simply calls db update when there is no task id present on the experiment', () => {
      target.getExperimentById = mockResolve({})
      target.securityService.permissionsCheck = mockResolve()
      dbWrite.experiments.updateExperimentStatus = mockResolve()

      return target.cancelReview(1, false, testContext, testTx).then(() => {
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalled()
        expect(OAuthUtil.getAuthorizationHeaders).not.toHaveBeenCalled()
      })
    })

    test('rejects when unable to complete task', () => {
      target.getExperimentById = mockResolve({ task_id: 123 })
      target.securityService.permissionsCheck = mockResolve()
      AppError.badRequest = mock()
      dbWrite.experiments.updateExperimentStatus = mock()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      const error = new Error('text')
      error.status = 400
      error.response = {
        text: 'error',
      }
      HttpUtil.put.mockReturnValueOnce(Promise.reject(error))

      return target.cancelReview(1, false, testContext, testTx).then(() => {}, () => {
        expect(dbWrite.experiments.updateExperimentStatus).not.toHaveBeenCalled()
        expect(AppError.badRequest).toHaveBeenCalledWith('Unable to complete task', null, '15S001')
      })
    })

    test('successfully completes a task and updates the experiment status', () => {
      target.getExperimentById = mockResolve({ task_id: 123 })
      target.securityService.permissionsCheck = mockResolve()
      dbWrite.experiments.updateExperimentStatus = mock()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.put.mockReturnValueOnce(Promise.resolve())

      return target.cancelReview(1, false, testContext, testTx).then(() => {
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalledWith(1, 'DRAFT', null, testContext, testTx)
      })
    })

    test('updates the experiment status when task complete call fails but is ignored', () => {
      target.getExperimentById = mockResolve({ task_id: 123 })
      target.securityService.permissionsCheck = mockResolve()
      dbWrite.experiments.updateExperimentStatus = mock()
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      const error = new Error('text')
      error.status = 404
      error.response = {
        text: 'error',
      }
      HttpUtil.put.mockReturnValueOnce(Promise.reject(error))

      return target.cancelReview(1, false, testContext, testTx).then(() => {
        expect(dbWrite.experiments.updateExperimentStatus).toHaveBeenCalledWith(1, 'DRAFT', null, testContext, testTx)
      })
    })
  })

  describe('notifyUsersReviewCompletion', () => {
    test('should send a message when a review is approved', async () => {
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: '60556ed1a58' } }))
      await target.notifyUsersReviewCompletion(false,
        { id: 12, name: 'test exp', owners: ['tester'] }, 'APPROVED', '')
      const expected = {
        title: 'COMPLETED: Experiment test exp Review Request',
        body: {
          text: 'Experiment test exp has been approved',
        },
        actions: [
          {
            title: 'Experiment "test exp"',
            url: `${apiUrls.velocityUrl}/experiments/12`,
          },
        ],
        recipients: ['tester'],
        tags: ['experiment-review-request'],
      }
      expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.velocityMessagingAPIUrl}/messages`, [], expected)
    })

    test('should send a message when a review is rejected', async () => {
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockReturnValueOnce(Promise.resolve({ body: { id: '60556ed1a58' } }))
      await target.notifyUsersReviewCompletion(true,
        { id: 12, name: 'test exp', ownerGroups: ['tester'] }, 'REJECTED', 'reason')
      const expected = {
        title: 'COMPLETED: Template test exp Review Request',
        body: {
          text: 'Template test exp has been rejected. Reason: reason',
        },
        actions: [
          {
            title: 'Template "test exp"',
            url: `${apiUrls.velocityUrl}/experiments/templates/12`,
          },
        ],
        userGroups: ['tester'],
        tags: ['experiment-review-request'],
      }
      expect(HttpUtil.post).toHaveBeenCalledWith(`${apiUrls.velocityMessagingAPIUrl}/messages`, [], expected)
    })

    test('should not send a message if the status is not rejected or approved', async () => {
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockRestore()
      await target.notifyUsersReviewCompletion(true,
        { id: 12, name: 'test exp', ownerGroups: ['tester'] }, 'SUBMITTED', '')
      expect(HttpUtil.post).not.toHaveBeenCalled()
    })

    test('log an error when failed to send a message', async () => {
      OAuthUtil.getAuthorizationHeaders.mockReturnValueOnce(Promise.resolve([]))
      HttpUtil.post.mockReturnValueOnce(Promise.reject())
      console.error.mockRestore()
      console.error = jest.fn()
      await target.notifyUsersReviewCompletion(true, { id: 12, name: 'test exp', ownerGroups: ['tester'] }, 'REJECTED', '')
      expect(console.error).toHaveBeenCalled()
    })
  })
})

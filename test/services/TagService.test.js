import { mock, mockReject, mockResolve } from '../jestUtil'
import TagService from '../../src/services/TagService'
import AppUtil from '../../src/services/utility/AppUtil'
import cfServices from '../../src/services/utility/ServiceConfig'

import HttpUtil from '../../src/services/utility/HttpUtil'
import PingUtil from '../../src/services/utility/PingUtil'

describe('TagService', () => {
  let target
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    target = new TagService()
  })

  describe('batchCreateTags', () => {
    const context = { userId: 'KMCCL' }
    test('creates tags', () => {
      target.validator.validate = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.post = mockResolve({ body: [{ id: 1 }] })
      AppUtil.createPostResponse = mock()
      target.getEntityName = mock('experiment')

      return target.batchCreateTags([{ experimentId: 1 }], context, false).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ experimentId: 1 }])
      })
    })

    test('rejects when batchCreate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.post = mockReject(error)
      target.getEntityName = mock('experiment')

      return target.batchCreateTags([{ experimentId: 1 }], context, false).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ experimentId: 1 }])
        expect(err).toEqual(error)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.post = mockReject(error)
      return target.batchCreateTags([], testContext, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([])
        expect(HttpUtil.post).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('saveTags', () => {
    const context = { userId: 'KMCCL' }
    test('creates tags', () => {
      target.validator.validate = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.put = mockResolve({ body: { id: 1 } })
      AppUtil.createPostResponse = mock()
      const tags = [{ category: 'tagCategory', value: 'tagValue' }]
      target.getEntityName = mock('experiment')
      return target.saveTags(tags, 1, context, false).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith(tags)
        expect(target.getEntityName).toHaveBeenCalledWith(false)
      })
    })

    test('rejects when saveTags fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockResolve()
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.put = mockReject(error)
      const tags = [{ category: 'tagCategory', value: 'tagValue' }]
      target.getEntityName = mock('experiment')
      return target.saveTags(tags, 1, context, false).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith(tags)
        expect(err).toEqual(error)
        expect(target.getEntityName).toHaveBeenCalledWith(false)
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.put = mockReject(error)
      return target.saveTags([], 1, false).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([])
        expect(HttpUtil.put).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('getTagsByExperimentId', () => {
    test('gets tags for an experiment', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: { tags: [] } })

      return target.getTagsByExperimentId(1, false, testTx).then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, {})
        expect(data).toEqual([])
      })
    })
    test('returns empty array when 404 status is returned by tagging api', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockReject({ status: 404 })

      return target.getTagsByExperimentId(1, false, testTx).then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, {})
        expect(data).toEqual([])
      })
    })

    test('rejects when get tags fails', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      const error = { message: 'error' }
      HttpUtil.get = mockReject(error)

      return target.getTagsByExperimentId(1, false, testTx).then(() => {}, (err) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, {})
        expect(err).toEqual(error)
      })
    })
  })

  describe('getAllTagsForEntity', () => {
    test('gets tags for all experiments', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: { entityId: 1, tags: [] } })

      return target.getAllTagsForEntity('experiment').then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment`, {})
        expect(data).toEqual({ entityId: 1, tags: [] })
      })
    })
    test('returns empty array when error status code is 404', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockReject({ status: 404 })

      return target.getAllTagsForEntity('experiment').then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment`, {})
        expect(data).toEqual([])
      })
    })

    test('rejects when get tags fails', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      const error = { message: 'error' }
      HttpUtil.get = mockReject(error)

      return target.getAllTagsForEntity('experiment').then(() => {}, (err) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment`, {})
        expect(err).toEqual(error)
      })
    })
  })

  describe('copyTags', () => {
    test('calls getTagsByExperimentId and batchCreateTags to copy tags of experiment when tags' +
      ' exists', () => {
      const context = { userId: 'user' }
      target.getTagsByExperimentId = mockResolve([{ category: 'org', value: 'dev' }])
      target.batchCreateTags = mockResolve()
      return target.copyTags(1, 2, context, false).then(() => {
        expect(target.getTagsByExperimentId).toHaveBeenCalledWith(1, false, context)
        expect(target.batchCreateTags).toHaveBeenCalledWith([{
          category: 'org',
          value: 'dev',
          experimentId: 2,
        }], context, false)
      })
    })

    test('calls getTagsByExperimentId and does not call batchCreateTags when tags do not exist', () => {
      const context = { userId: 'user' }
      target.getTagsByExperimentId = mockResolve([])
      target.batchCreateTags = mockResolve()
      return target.copyTags(1, 2, context, false).then(() => {
        expect(target.getTagsByExperimentId).toHaveBeenCalledWith(1, false, context)
        expect(target.batchCreateTags).not.toHaveBeenCalled()
      })
    })
  })

  describe('getEntityTagsByTagFilters', () => {
    test('gets tag entities matching filter criteria', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      HttpUtil.get = mockResolve({ body: [{ entityId: 1, tags: [] }] })

      return target.getEntityTagsByTagFilters(['tag1'], ['val1']).then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment?tags.category=tag1&tags.value=val1`, {})
        expect(data).toEqual([{ entityId: 1, tags: [] }])
      })
    })
    test('rejects when get tags fails', () => {
      PingUtil.getMonsantoHeader = mockResolve({})
      const error = { message: 'error' }
      HttpUtil.get = mockReject(error)

      return target.getEntityTagsByTagFilters(['tag1'], ['val1'], false, { requestId: 5 }).then(() => {}, (err) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment?tags.category=tag1&tags.value=val1`, {})
        expect(err).toEqual(error)
      })
    })
  })

  describe('deleteTagsForExperimentId', () => {
    const context = { userId: 'KMCCL' }
    test('deletes tags for an experimentId', () => {
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.delete = mockResolve([])
      target.getEntityName = mock('experiment')
      return target.deleteTagsForExperimentId(1, context, false).then(() => {
        expect(HttpUtil.delete).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, [{}, {
          headerName: 'oauth_resourceownerinfo',
          headerValue: 'username=KMCCL',
        }])
      })
    })

    test('Resolves promise when tagging api returns 404 status', () => {
      PingUtil.getMonsantoHeader = mockResolve([{}])
      HttpUtil.delete = mockReject({ status: 404 })
      target.getEntityName = mock('experiment')
      return target.deleteTagsForExperimentId(1, context, false).then(() => {
        expect(HttpUtil.delete).toHaveBeenCalledWith(`${cfServices.experimentsExternalAPIUrls.value.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, [{}, {
          headerName: 'oauth_resourceownerinfo',
          headerValue: 'username=KMCCL',
        }])
      })
    })

    test('rejects when removeByExperimentId fails', () => {
      PingUtil.getMonsantoHeader = mockResolve([{}])
      target.getEntityName = mock('experiment')
      const error = { message: 'error' }
      HttpUtil.delete = mockReject(error)

      return target.deleteTagsForExperimentId(1, testTx, false).then(() => {}, (err) => {
        expect(err).toEqual(error)
      })
    })
  })

  describe(('EntityName'), () => {
    test('return template when the isTemplate is true', () => {
      const result = target.getEntityName(true)
      expect(result).toBe('template')
    })
    test('return experiment when the isTemplate is false', () => {
      const result = target.getEntityName(false)
      expect(result).toBe('experiment')
    })
  })
})

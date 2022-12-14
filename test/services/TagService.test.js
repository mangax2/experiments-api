import { mock, mockReject, mockResolve } from '../jestUtil'
import TagService from '../../src/services/TagService'
import AppUtil from '../../src/services/utility/AppUtil'
import apiUrls from '../configs/apiUrls'

import HttpUtil from '../../src/services/utility/HttpUtil'
import OAuthUtil from '../../src/services/utility/OAuthUtil'
import AppError from '../../src/services/utility/AppError'

describe('TagService', () => {
  let target
  const testTx = { tx: {} }
  const appErrorResponse = { errorMessage: 'testError' }
  const context = { requestId: 'requestId' }

  beforeEach(() => {
    target = new TagService()
  })

  describe('batchCreateTags', () => {
    test('creates tags', () => {
      target.validator.validate = mockResolve()
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
      HttpUtil.post = mockResolve({ body: [{ id: 1 }] })
      AppUtil.createPostResponse = mock()
      target.getEntityName = mock('experiment')

      return target.batchCreateTags([{ experimentId: 1 }], context, false).then(() => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ experimentId: 1 }])
      })
    })

    test('rejects when batchCreate fails', () => {
      const body = { message: 'error' }
      const error = { response: { body } }
      target.validator.validate = mockResolve()
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
      HttpUtil.post = mockReject(error)
      target.getEntityName = mock('experiment')
      AppError.internalServerErrorWithMessage = mock(appErrorResponse)

      return target.batchCreateTags([{ experimentId: 1 }], context, false).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([{ experimentId: 1 }])
        expect(err).toEqual(appErrorResponse)
        expect(AppError.internalServerErrorWithMessage).toHaveBeenCalledWith(
          '[[requestId]] An error occurred while creating the tags.',
          body,
          '1P1001',
        )
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
      HttpUtil.post = mockReject(error)
      return target.batchCreateTags([], context, testTx).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith([])
        expect(HttpUtil.post).not.toHaveBeenCalled()
        expect(err).toEqual(error)
      })
    })
  })

  describe('saveTags', () => {
    test('creates tags', () => {
      target.validator.validate = mockResolve()
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
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
      const body = { message: 'error' }
      const error = { response: { body } }
      target.validator.validate = mockResolve()
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
      HttpUtil.put = mockReject(error)
      const tags = [{ category: 'tagCategory', value: 'tagValue' }]
      target.getEntityName = mock('experiment')
      AppError.internalServerErrorWithMessage = mock(appErrorResponse)

      return target.saveTags(tags, 1, context, false).then(() => {}, (err) => {
        expect(target.validator.validate).toHaveBeenCalledWith(tags)
        expect(err).toEqual(appErrorResponse)
        expect(target.getEntityName).toHaveBeenCalledWith(false)
        expect(AppError.internalServerErrorWithMessage).toHaveBeenCalledWith(
          '[[requestId]] An error occurred while saving the tags.',
          body,
          '1P3001',
        )
      })
    })

    test('rejects when validate fails', () => {
      const error = { message: 'error' }
      target.validator.validate = mockReject(error)
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
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
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      HttpUtil.get = mockResolve({ body: { tags: [] } })

      return target.getTagsByExperimentId(1, false, testTx).then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, {})
        expect(data).toEqual([])
      })
    })
    test('returns empty array when 404 status is returned by tagging api', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      HttpUtil.get = mockReject({ status: 404 })

      return target.getTagsByExperimentId(1, false, testTx).then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, {})
        expect(data).toEqual([])
      })
    })

    test('rejects when get tags fails', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      const body = { message: 'error' }
      const error = { response: { body } }
      HttpUtil.get = mockReject(error)
      AppError.internalServerErrorWithMessage = mock(appErrorResponse)

      return target.getTagsByExperimentId(1, false, context).then(() => {}, (err) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, {})
        expect(err).toEqual(appErrorResponse)
        expect(AppError.internalServerErrorWithMessage).toHaveBeenCalledWith(
          '[[requestId]] An error occurred while getting the tags for experiment id: 1',
          body,
          '1P4001',
        )
      })
    })
  })

  describe('getAllTagsForEntity', () => {
    test('gets tags for all experiments', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      HttpUtil.get = mockResolve({ body: { entityId: 1, tags: [] } })

      return target.getAllTagsForEntity('experiment').then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment`, {})
        expect(data).toEqual({ entityId: 1, tags: [] })
      })
    })
    test('returns empty array when error status code is 404', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      HttpUtil.get = mockReject({ status: 404 })

      return target.getAllTagsForEntity('experiment').then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment`, {})
        expect(data).toEqual([])
      })
    })

    test('rejects when get tags fails', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      const body = { message: 'error' }
      const error = { response: { body } }
      HttpUtil.get = mockReject(error)
      AppError.internalServerErrorWithMessage = mock(appErrorResponse)

      return target.getAllTagsForEntity('experiment').then(() => {}, (err) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment`, {})
        expect(err).toEqual(appErrorResponse)
        expect(AppError.internalServerErrorWithMessage).toHaveBeenCalledWith(
          'An error occurred while retrieving tags.',
          body,
          '1P7001',
        )
      })
    })
  })

  describe('copyTags', () => {
    test('calls getTagsByExperimentId and batchCreateTags to copy tags of experiment when tags exists', () => {
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
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      HttpUtil.get = mockResolve({ body: [{ entityId: 1, tags: [] }] })

      return target.getEntityTagsByTagFilters(['tag1'], ['val1']).then((data) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment?tags.category=tag1&tags.value=val1`, {})
        expect(data).toEqual([{ entityId: 1, tags: [] }])
      })
    })

    test('rejects when get tags fails', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve({})
      const body = { message: 'error' }
      const error = { response: { body } }
      HttpUtil.get = mockReject(error)
      AppError.internalServerErrorWithMessage = mock(appErrorResponse)

      return target.getEntityTagsByTagFilters(['tag1'], ['val1'], false, context).then(() => {}, (err) => {
        expect(HttpUtil.get).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment?tags.category=tag1&tags.value=val1`, {})
        expect(err).toEqual(appErrorResponse)
        expect(AppError.internalServerErrorWithMessage).toHaveBeenCalledWith(
          '[[requestId]] An error occurred while getting tags by filters.',
          body,
          '1P6001',
        )
      })
    })
  })

  describe('deleteTagsForExperimentId', () => {
    test('deletes tags for an experimentId', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
      HttpUtil.delete = mockResolve([])
      target.getEntityName = mock('experiment')

      return target.deleteTagsForExperimentId(1, context, false).then(() => {
        expect(HttpUtil.delete).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, [{}])
      })
    })

    test('Resolves promise when tagging api returns 404 status', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
      HttpUtil.delete = mockReject({ status: 404 })
      target.getEntityName = mock('experiment')
      return target.deleteTagsForExperimentId(1, context, false).then(() => {
        expect(HttpUtil.delete).toHaveBeenCalledWith(`${apiUrls.experimentsTaggingAPIUrl}/entity-tags/experiment/1`, [{}])
      })
    })

    test('rejects when removeByExperimentId fails', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve([{}])
      target.getEntityName = mock('experiment')
      const body = { message: 'error' }
      const error = { response: { body } }
      HttpUtil.delete = mockReject(error)
      AppError.internalServerErrorWithMessage = mock(appErrorResponse)

      return target.deleteTagsForExperimentId(1, context, false).then(() => {}, (err) => {
        expect(err).toEqual(appErrorResponse)
        expect(AppError.internalServerErrorWithMessage).toHaveBeenCalledWith(
          '[[requestId]] An error occurred while deleting tags.',
          body,
          '1P9001',
        )
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

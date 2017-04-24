import { mock } from '../../jestUtil'
import AppUtil from '../../../src/services/utility/AppUtil'

describe('AppUtil', () => {
  describe('createResponseElements', () => {
    it('returns an object with a status, message, and id', () => {
      expect(AppUtil.createResponseElements(1, 200, 'testMessage')).toEqual({
        id: 1,
        status: 200,
        message: 'testMessage',
      })
    })
  })

  describe('createPostResponse', () => {
    it('returns an empty array when data is null', () => {
      expect(AppUtil.createPostResponse(null)).toEqual([])
    })

    it('returns an empty array when data is undefined', () => {
      expect(AppUtil.createPostResponse(undefined)).toEqual([])
    })

    it('calls createResponseElements with data', () => {
      AppUtil.createResponseElements = mock()

      AppUtil.createPostResponse([{ id: 1 }])

      expect(AppUtil.createResponseElements).toHaveBeenCalledWith(1, 201, 'Resource created')
    })

  })

  describe('createPutResponse', () => {
    it('returns an empty array when data is null', () => {
      expect(AppUtil.createPutResponse(null)).toEqual([])
    })

    it('returns an empty array when data is undefined', () => {
      expect(AppUtil.createPutResponse(undefined)).toEqual([])
    })

    it('calls createResponseElements with data', () => {
      AppUtil.createResponseElements = mock()

      AppUtil.createPutResponse([{ id: 1 }])

      expect(AppUtil.createResponseElements).toHaveBeenCalledWith(1, 200, 'Resource updated')
    })
  })

  describe('createCompositePostResponse', () => {
    it('returns an object with a status and success message', () => {
      expect(AppUtil.createCompositePostResponse()).toEqual({ status: 200, message: 'SUCCESS' })
    })
  })
})
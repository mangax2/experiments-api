import QuestionsUtil from '../../../src/services/utility/QuestionsUtil'
import AppError from '../../../src/services/utility/AppError'
import HttpUtil from '../../../src/services/utility/HttpUtil'
import OAuthUtil from '../../../src/services/utility/OAuthUtil'
import apiUrls from '../../configs/apiUrls'
import { mock, mockReject, mockResolve } from '../../jestUtil'

const testHeaders = [{ name: 'authorization', value: 'bearer token' }]
apiUrls.questionsV3APIUrl = 'baseUrl'

describe('QuestionsUtil', () => {
  describe('getAnswerKeys', () => {
    test('calls getWithRetry with the expected URL', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve(testHeaders)
      HttpUtil.getWithRetry = mockResolve({})

      return QuestionsUtil.getAnswerKeys('questionCode', 'uomCode').then(() => {
        expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
        expect(HttpUtil.getWithRetry).toHaveBeenCalledWith('baseUrl/validation/question/questionCode/uom/uomCode', testHeaders)
      })
    })

    test('does not catch the OAuthUtil error if retrieving headers fails', () => {
      OAuthUtil.getAuthorizationHeaders = mockReject('error')
      HttpUtil.getWithRetry = mockResolve({})
      AppError.internalServerError = mock()

      return QuestionsUtil.getAnswerKeys('questionCode', 'uomCode').catch((err) => {
        expect(err).toBe('error')
        expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
        expect(HttpUtil.getWithRetry).not.toHaveBeenCalled()
        expect(AppError.internalServerError).not.toHaveBeenCalled()
      })
    })

    test('formats a new error message with AppError if HttpUtil fails', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve(testHeaders)
      HttpUtil.getWithRetry = mockReject('error')
      const error = new Error()
      AppError.internalServerError = mock(error)

      return QuestionsUtil.getAnswerKeys('questionCode', 'uomCode').catch((err) => {
        expect(err).toBe(error)
        expect(AppError.internalServerError).toHaveBeenCalledWith('Internal Server Error', 'Questions API returned an error')
      })
    })

    test('picks out the keys from the http response on success', () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve(testHeaders)
      HttpUtil.getWithRetry = mockResolve({
        body: {
          rule: {
            values: [{ key: 123 }, { key: 456 }],
          },
        },
      })
      AppError.internalServerError = mock()

      return QuestionsUtil.getAnswerKeys('questionCode', 'uomCode').then((result) => {
        expect(result).toEqual([123, 456])
        expect(AppError.internalServerError).not.toHaveBeenCalled()
      })
    })
  })

  describe('getCompleteQuestion', () => {
    test('calls getWithRetry with the expected URL', async () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve(testHeaders)
      HttpUtil.getWithRetry = mockResolve({ body: [] })

      await QuestionsUtil.getCompleteQuestion('questionCode')

      expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
      expect(HttpUtil.getWithRetry).toHaveBeenCalledWith('baseUrl/question-complete?questionCode=questionCode', testHeaders)
    })

    test('does not catch the OAuthUtil error if retrieving headers fails', async () => {
      OAuthUtil.getAuthorizationHeaders = mockReject('error')
      HttpUtil.getWithRetry = mockResolve({})
      AppError.internalServerError = mock()

      try {
        await QuestionsUtil.getCompleteQuestion('questionCode')
      } catch (err) {
        expect(err).toBe('error')
        expect(OAuthUtil.getAuthorizationHeaders).toHaveBeenCalled()
        expect(HttpUtil.getWithRetry).not.toHaveBeenCalled()
        expect(AppError.internalServerError).not.toHaveBeenCalled()
      }
    })

    test('formats a new error message with AppError if HttpUtil fails', async () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve(testHeaders)
      HttpUtil.getWithRetry = mockReject('error')
      const error = new Error()
      AppError.internalServerError = mock(error)

      try {
        await QuestionsUtil.getCompleteQuestion('questionCode')
      } catch (err) {
        expect(err).toBe(error)
        expect(AppError.internalServerError).toHaveBeenCalledWith('Internal Server Error', 'Questions API returned an error')
      }
    })

    test('picks out the keys from the http response on success', async () => {
      OAuthUtil.getAuthorizationHeaders = mockResolve(testHeaders)
      const questionComplete = {
        code: 'APP_TIM',
        text: 'Application Timing',
        uoms: [],
      }
      HttpUtil.getWithRetry = mockResolve({
        body: [questionComplete],
      })
      AppError.internalServerError = mock()

      const result = await QuestionsUtil.getCompleteQuestion('questionCode')

      expect(result).toEqual(questionComplete)
      expect(AppError.internalServerError).not.toHaveBeenCalled()
    })
  })
})

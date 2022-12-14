import _ from 'lodash'
import AppError from './AppError'
import HttpUtil from './HttpUtil'
import OAuthUtil from './OAuthUtil'
import configurator from '../../configs/configurator'

const apiUrls = configurator.get('urls')

class QuestionsUtil {
  static getCompleteQuestion = async (questionCode) => {
    const headers = await OAuthUtil.getAuthorizationHeaders()
    try {
      const { body } = await HttpUtil.getWithRetry(`${apiUrls.questionsV3APIUrl}/question-complete?questionCode=${questionCode}`, headers)
      return body[0]
    } catch (error) {
      console.error('Questions API returned error', error.message)
      throw AppError.internalServerError('Internal Server Error', 'Questions API returned an error')
    }
  }

  static getAnswerKeys = (questionCode, uomCode) =>
    OAuthUtil.getAuthorizationHeaders().then(headers =>
      HttpUtil.getWithRetry(`${apiUrls.questionsV3APIUrl}/validation/question/${questionCode}/uom/${uomCode}`, headers)
        .then(response => _.map(_.get(response.body, 'rule.values'), 'key'))
        .catch((error) => {
          console.error('Questions API returned error', error.message)
          throw AppError.internalServerError('Internal Server Error', 'Questions API returned an error')
        }))
}

export default QuestionsUtil

import _ from 'lodash'
import AppError from './AppError'
import HttpUtil from './HttpUtil'
import PingUtil from './PingUtil'
import apiUrls from '../../config/apiUrls'

class QuestionsUtil {
  static getAnswerKeys = (questionCode, uomCode) =>
    PingUtil.getMonsantoHeader().then(headers =>
      HttpUtil.getWithRetry(`${apiUrls.questionsV3APIUrl}/validation/question/${questionCode}/uom/${uomCode}`, headers)
        .then(response => _.map(_.get(response.body, 'rule.values'), 'key'))
        .catch((error) => {
          console.error('Questions API returned error', error.message)
          throw AppError.internalServerError('Internal Server Error', 'Questions API returned an error')
        }))
}

export default QuestionsUtil

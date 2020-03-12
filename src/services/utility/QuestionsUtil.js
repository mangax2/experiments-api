import _ from 'lodash'
import log4js from 'log4js'
import AppError from './AppError'
import HttpUtil from './HttpUtil'
import PingUtil from './PingUtil'
import cfServices from './ServiceConfig'

const logger = log4js.getLogger('QuestionsUtil')

class QuestionsUtil {
  static getAnswerKeys = (questionCode, uomCode) =>
    PingUtil.getMonsantoHeader().then(headers =>
      HttpUtil.getWithRetry(`${cfServices.experimentsExternalAPIUrls.value.questionsV3APIUrl}/validation/question/${questionCode}/uom/${uomCode}`, headers)
        .then(response => _.map(_.get(response.body, 'rule.values'), 'key'))
        .catch((error) => {
          logger.error('Questions API returned error', error.message)
          throw AppError.internalServerError('Internal Server Error', 'Questions API returned an error')
        }))
}

export default QuestionsUtil

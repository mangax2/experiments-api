import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import Transactional from '../decorators/transactional'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('ExperimentSummaryService')

// Error Codes 19XXXX
class ExperimentSummaryService {
  constructor() {
    this.experimentService = new ExperimentsService()
  }

  @setErrorCode('191000')
  @Transactional('getExperimentSummaryById')
  getExperimentSummaryById(id, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(id, isTemplate, context, tx)
      .then(() => db.experimentSummary.find(id, tx)
        .then((data) => {
          if (!data) {
            logger.error(`[[${context.requestId}]] Experiment Summary Not Found for requested experimentId = ${id}`)
            throw AppError.notFound('Experiment Summary Not Found for requested experimentId', undefined, getFullErrorCode('191001'))
          } else {
            return data
          }
        }),
      )
  }
}

module.exports = ExperimentSummaryService

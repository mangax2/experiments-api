import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('ExperimentSummaryService')

class ExperimentSummaryService {
  constructor() {
    this.experimentService = new ExperimentsService()
  }

  @Transactional('getExperimentSummaryById')
  getExperimentSummaryById(id, tx) {
    return this.experimentService.getExperimentById(id, tx)
      .then(() => db.experimentSummary.find(id, tx)
        .then((data) => {
          if (!data) {
            logger.error(`Experiment Summary Not Found for requested experimentId = ${id}`)
            throw AppError.notFound('Experiment Summary Not Found for requested experimentId')
          } else {
            return data
          }
        }),
      )
  }
}

module.exports = ExperimentSummaryService

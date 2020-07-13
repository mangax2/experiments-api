import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import ExperimentsService from './ExperimentsService'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

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
            console.error(`[[${context.requestId}]] Experiment Summary Not Found for requested experimentId = ${id}`)
            throw AppError.notFound('Experiment Summary Not Found for requested experimentId', undefined, getFullErrorCode('191001'))
          } else {
            data.numberOfTreatmentVariables = data.number_of_independent_variables
            data.numberOfResponseVariables = data.number_of_dependent_variables
            delete data.number_of_independent_variables
            delete data.number_of_dependent_variables
            return data
          }
        }),
      )
  }
}

module.exports = ExperimentSummaryService

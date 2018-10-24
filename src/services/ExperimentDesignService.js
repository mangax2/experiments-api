import db from '../db/DbManager'
import ExperimentDesignsValidator from '../validations/ExperimentDesignsValidator'
import AppError from './utility/AppError'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 18XXXX
class ExperimentDesignService {
  constructor() {
    this.validator = new ExperimentDesignsValidator()
  }

  @setErrorCode('181000')
  createExperimentDesign(experimentDesign, context) {
    return this.validator.validate([experimentDesign])
      .then(() => db.experimentDesign.repository().tx('createExperimentDesignTransaction', t => db.experimentDesign.create(t, experimentDesign, context)))
  }

  @setErrorCode('182000')
  getAllExperimentDesigns = () => db.experimentDesign.all()

  @setErrorCode('183000')
  getExperimentDesignById = id => db.experimentDesign.find(id)
    .then((data) => {
      if (!data) {
        throw AppError.notFound('Experiment Design Not Found', undefined, getFullErrorCode('183001'))
      } else {
        return data
      }
    })
}

module.exports = ExperimentDesignService

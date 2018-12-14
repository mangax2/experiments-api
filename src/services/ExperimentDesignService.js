import db from '../db/DbManager'
import ExperimentDesignsValidator from '../validations/ExperimentDesignsValidator'


const { setErrorCode } = require('@monsantoit/error-decorator')()

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
}

module.exports = ExperimentDesignService

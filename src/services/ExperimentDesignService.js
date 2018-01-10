import db from '../db/DbManager'
import ExperimentDesignsValidator from '../validations/ExperimentDesignsValidator'
import AppError from './utility/AppError'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

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

  @setErrorCode('184000')
  updateExperimentDesign(id, experimentDesign, context) {
    return this.validator.validate([experimentDesign])
      .then(() => db.experimentDesign.update(id, experimentDesign, context)
        .then((data) => {
          if (!data) {
            throw AppError.notFound('Experiment Design Not Found', undefined, getFullErrorCode('184001'))
          } else {
            return data
          }
        }),
      )
  }

  @setErrorCode('185000')
  deleteExperimentDesign = id => db.experimentDesign.delete(id)
    .then((data) => {
      if (!data) {
        throw AppError.notFound('Experiment Design Not Found', undefined, getFullErrorCode('185001'))
      } else {
        return data
      }
    })
}

module.exports = ExperimentDesignService

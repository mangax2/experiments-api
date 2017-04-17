import db from '../db/DbManager'
import ExperimentDesignsValidator from '../validations/ExperimentDesignsValidator'
import AppError from './utility/AppError'

class ExperimentDesignService {
  constructor() {
    this.validator = new ExperimentDesignsValidator()
  }

  createExperimentDesign(experimentDesign, context) {
    return this.validator.validate([experimentDesign])
      .then(() => db.experimentDesign.repository().tx('createExperimentDesignTransaction', t => db.experimentDesign.create(t, experimentDesign, context)))
  }

  getAllExperimentDesigns = () => db.experimentDesign.all()

  getExperimentDesignById = id => db.experimentDesign.find(id)
    .then((data) => {
      if (!data) {
        throw AppError.notFound('Experiment Design Not Found')
      } else {
        return data
      }
    })

  updateExperimentDesign(id, experimentDesign, context) {
    return this.validator.validate([experimentDesign])
      .then(() => db.experimentDesign.update(id, experimentDesign, context)
        .then((data) => {
          if (!data) {
            throw AppError.notFound('Experiment Design Not Found')
          } else {
            return data
          }
        }),
      )
  }

  deleteExperimentDesign = id => db.experimentDesign.delete(id)
    .then((data) => {
      if (!data) {
        throw AppError.notFound('Experiment Design Not Found')
      } else {
        return data
      }
    })
}

module.exports = ExperimentDesignService

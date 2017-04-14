import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import DependentVariablesValidator from '../validations/DependentVariablesValidator'
import ExperimentsService from './ExperimentsService'
import Transactional from '../decorators/transactional'

const logger = log4js.getLogger('DependentVariableService')

class DependentVariableService {

  constructor() {
    this.validator = new DependentVariablesValidator()
    this.experimentService = new ExperimentsService()
  }

  @Transactional('createDependentVariablesTx')
  batchCreateDependentVariables(dependentVariables, context, tx) {
    return this.validator.validate(dependentVariables, 'POST', tx)
      .then(() => db.dependentVariable.batchCreate(tx, dependentVariables, context)
        .then(data => AppUtil.createPostResponse(data)))
  }

  getAllDependentVariables = () => db.dependentVariable.all()

  getDependentVariablesByExperimentId(experimentId) {
    return this.experimentService.getExperimentById(experimentId)
      .then(() => db.dependentVariable.findByExperimentId(experimentId))
  }

  getDependentVariableById = id => db.dependentVariable.find(id)
      .then((data) => {
        if (!data) {
          logger.error(`Dependent Variable Not Found for requested id = ${id}`)
          throw AppError.notFound('Dependent Variable Not Found for requested id')
        } else {
          return data
        }
      })

  batchUpdateDependentVariables(dependentVariables, context) {
    return this.validator.validate(dependentVariables, 'PUT')
      .then(() => db.dependentVariable.repository().tx('updateDependentVariablesTx', t => db.dependentVariable.batchUpdate(t, dependentVariables, context)
        .then(data => AppUtil.createPutResponse(data))))
  }

  deleteDependentVariable(id) {
    return db.dependentVariable.remove(id)
      .then((data) => {
        if (!data) {
          logger.error(`Dependent Variable Not Found for requested id = ${id}`)
          throw AppError.notFound('Dependent Variable Not Found for requested id')
        } else {
          return data
        }
      })
  }

  @Transactional('deleteDependentVariablesForExperimentId')
  deleteDependentVariablesForExperimentId(experimentId, tx) {
    return this.experimentService.getExperimentById(experimentId, tx)
      .then(() => db.dependentVariable.removeByExperimentId(tx, experimentId))
  }
}

module.exports = DependentVariableService

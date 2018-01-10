import log4js from 'log4js'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import AppError from './utility/AppError'
import DependentVariablesValidator from '../validations/DependentVariablesValidator'
import ExperimentsService from './ExperimentsService'
import Transactional from '../decorators/transactional'
import { getFullErrorCode, setErrorCode } from '../decorators/setErrorDecorator'

const logger = log4js.getLogger('DependentVariableService')

// Error Codes 12XXXX
class DependentVariableService {
  constructor() {
    this.validator = new DependentVariablesValidator()
    this.experimentService = new ExperimentsService()
  }

  @setErrorCode('121000')
  @Transactional('createDependentVariablesTx')
  batchCreateDependentVariables(dependentVariables, context, tx) {
    return this.validator.validate(dependentVariables, 'POST', tx)
      .then(() => db.dependentVariable.batchCreate(tx, dependentVariables, context)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('122000')
  getAllDependentVariables = () => db.dependentVariable.all()

  @setErrorCode('123000')
  @Transactional('getDependentVariablesByExperimentId')
  getDependentVariablesByExperimentId(experimentId, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(experimentId, isTemplate, context, tx)
      .then(() => db.dependentVariable.findByExperimentId(experimentId, tx))
  }

  @setErrorCode('124000')
  @Transactional('getDependentVariablesByExperimentIdNoExistenceCheck')
  static getDependentVariablesByExperimentIdNoExistenceCheck(experimentId, tx) {
    return db.dependentVariable.findByExperimentId(experimentId, tx)
  }

  @setErrorCode('125000')
  getDependentVariableById = (id, context) => db.dependentVariable.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] Dependent Variable Not Found for requested id = ${id}`)
        throw AppError.notFound('Dependent Variable Not Found for requested id', undefined, getFullErrorCode('125001'))
      } else {
        return data
      }
    })

  @setErrorCode('126000')
  batchUpdateDependentVariables(dependentVariables, context) {
    return this.validator.validate(dependentVariables, 'PUT')
      .then(() => db.dependentVariable.repository().tx('updateDependentVariablesTx', t => db.dependentVariable.batchUpdate(t, dependentVariables, context)
        .then(data => AppUtil.createPutResponse(data))))
  }

  @setErrorCode('127000')
  @Transactional('deleteDependentVariablesForExperimentId')
  deleteDependentVariablesForExperimentId(experimentId, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(experimentId, isTemplate, context, tx)
      .then(() => db.dependentVariable.removeByExperimentId(tx, experimentId))
  }
}

module.exports = DependentVariableService

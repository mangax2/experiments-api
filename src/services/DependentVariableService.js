import Transactional from '@monsantoit/pg-transactional'
import db from '../db/DbManager'
import AppUtil from './utility/AppUtil'
import DependentVariablesValidator from '../validations/DependentVariablesValidator'
import ExperimentsService from './ExperimentsService'

const { setErrorCode } = require('@monsantoit/error-decorator')()
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
  //
  // @setErrorCode('122000')
  // getAllDependentVariables = () => db.dependentVariable.all()

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

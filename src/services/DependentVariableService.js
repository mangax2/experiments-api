import Transactional from '@monsantoit/pg-transactional'
import { dbRead, dbWrite } from '../db/DbManager'
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
    return this.validator.validate(dependentVariables, 'POST')
      .then(() => dbWrite.dependentVariable.batchCreate(tx, dependentVariables, context)
        .then(data => AppUtil.createPostResponse(data)))
  }

  @setErrorCode('123000')
  getDependentVariablesByExperimentId(experimentId, isTemplate, context) {
    return this.experimentService.getExperimentById(experimentId, isTemplate, context)
      .then(() => dbRead.dependentVariable.findByExperimentId(experimentId))
  }

  @setErrorCode('124000')
  static getDependentVariablesByExperimentIdNoExistenceCheck(experimentId) {
    return dbRead.dependentVariable.findByExperimentId(experimentId)
  }

  @setErrorCode('126000')
  @Transactional('batchUpdateDependentVariables')
  batchUpdateDependentVariables(dependentVariables, context, tx) {
    return this.validator.validate(dependentVariables, 'PUT')
      .then(() => dbWrite.dependentVariable.batchUpdate(tx, dependentVariables, context)
        .then(data => AppUtil.createPutResponse(data)))
  }

  @setErrorCode('127000')
  @Transactional('deleteDependentVariablesForExperimentId')
  deleteDependentVariablesForExperimentId(experimentId, isTemplate, context, tx) {
    return this.experimentService.getExperimentById(experimentId, isTemplate, context)
      .then(() => dbWrite.dependentVariable.removeByExperimentId(tx, experimentId))
  }
}

module.exports = DependentVariableService

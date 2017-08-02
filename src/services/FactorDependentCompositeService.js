import * as _ from 'lodash'
import AppUtil from './utility/AppUtil'
import ExperimentsService from './ExperimentsService'
import FactorLevelService from './FactorLevelService'
import FactorService from './FactorService'
import DependentVariableService from './DependentVariableService'
import FactorTypeService from './FactorTypeService'
import SecurityService from './SecurityService'
import Transactional from '../decorators/transactional'
import VariablesValidator from '../validations/VariablesValidator'

class FactorDependentCompositeService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.factorLevelService = new FactorLevelService()
    this.factorService = new FactorService()
    this.dependentVariableService = new DependentVariableService()
    this.factorTypeService = new FactorTypeService()
    this.securityService = new SecurityService()
    this.variablesValidator = new VariablesValidator()
  }

  getFactorsWithLevels(experimentId, isTemplate) {
    return this.getFactors(experimentId, isTemplate)
      .then(factors => this.getFactorLevels(factors)
        .then(levels => ({
          factors: _.flatten(factors),
          levels: _.flatten(levels),
        })),
      )
  }

  getFactors(experimentId, isTemplate) {
    return this.factorService.getFactorsByExperimentId(experimentId, isTemplate)
  }

  getFactorLevels(factors) {
    return Promise.all(_.map(factors, factor =>
      this.factorLevelService.getFactorLevelsByFactorId(factor.id)),
    )
  }

  getAllVariablesByExperimentId(experimentId, isTemplate) {
    return Promise.all(
      [
        this.getFactorsWithLevels(experimentId, isTemplate),
        this.factorTypeService.getAllFactorTypes(),
        this.dependentVariableService.getDependentVariablesByExperimentId(experimentId, isTemplate),
      ],
    ).then((value) => {
      const variablesObject = {
        independent: [],
        exogenous: [],
        dependent: [],
      }

      const factors = _.map(value[0].factors, (factor) => {
        const levels = _.filter(value[0].levels, level =>
          Number(level.factor_id) === Number(factor.id),
        )
        const levelValues = _.map(levels, level => level.value)

        const type = _.find(value[1], { id: factor.ref_factor_type_id }).type.toLowerCase()
        return {
          name: factor.name,
          type,
          levels: levelValues,
          tier: factor.tier,
          refDataSourceId: factor.ref_data_source_id,
        }
      })

      _.each(factors, (factor) => {
        const type = factor.type
        delete factor.type
        variablesObject[type].push(factor)
      })
      variablesObject.dependent = _.map(value[2], dependentVariable => ({
        name: dependentVariable.name,
        required: dependentVariable.required,
        questionCode: dependentVariable.question_code,
      }))

      return variablesObject
    })
  }

  /**
   * @return {number}
   */
  static get INDEPENDENT_VARIABLE_TYPE_ID() {
    return 1
  }

  /**
   * @return {number}
   */
  static get EXOGENOUS_VARIABLE_TYPE_ID() {
    return 2
  }

  static mapVariableDTO2DbEntity(variables, experimentId, variableTypeId) {
    return _.map(variables, (variable) => {
      variable.refFactorTypeId = variableTypeId
      variable.experimentId = experimentId
      return variable
    })
  }

  static mapLevelDTO2DbEntity(levels, factorId) {
    return _.map(levels, level => ({
      value: level,
      factorId,
    }))
  }

  static mapDependentVariableDTO2DbEntity(dependentVariables, experimentId) {
    return _.map(dependentVariables, (dependentVariable) => {
      dependentVariable.experimentId = experimentId
      return dependentVariable
    })
  }

  static mapIndependentAndExogenousVariableDTO2Entity(experimentId,
    independentVariables, exogenousVariables) {
    const independentVariableEntities =
      FactorDependentCompositeService.mapVariableDTO2DbEntity(
        independentVariables,
        experimentId,
        FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID,
      )

    const exogenousVariableEntities =
      FactorDependentCompositeService.mapVariableDTO2DbEntity(
        exogenousVariables,
        experimentId,
        FactorDependentCompositeService.EXOGENOUS_VARIABLE_TYPE_ID,
      )

    return _.concat(independentVariableEntities, exogenousVariableEntities)
  }

  static mapVariablesDTO2LevelsEntity(variables, ids) {
    // This produces an array of arrays where each sub array represents levels of a variable
    const factorLevels = _.map(variables, (factor, factorIndex) =>
      FactorDependentCompositeService.mapLevelDTO2DbEntity(factor.levels, ids[factorIndex].id),
    )
    // This returns an array of levels removing the sub array.
    return _.flatten(factorLevels)
  }

  persistVariablesWithLevels(experimentId, independentAndExogenousVariables, context, tx) {
    return this.factorService.deleteFactorsForExperimentId(experimentId, tx).then(() => {
      if (independentAndExogenousVariables.length > 0) {
        return this.factorService.batchCreateFactors(independentAndExogenousVariables, context, tx)
          .then((ids) => {
            const levelEntities = FactorDependentCompositeService.mapVariablesDTO2LevelsEntity(
              independentAndExogenousVariables,
              ids,
            )
            if (levelEntities.length > 0) {
              return this.factorLevelService.batchCreateFactorLevels(
                levelEntities,
                context,
                tx)
            }
            return Promise.resolve()
          })
      }
      return Promise.resolve()
    })
  }

  persistVariablesWithoutLevels(experimentId, dependentVariables, context, tx) {
    return this.dependentVariableService.deleteDependentVariablesForExperimentId(experimentId, tx)
      .then(() => {
        if (dependentVariables.length > 0) {
          return this.dependentVariableService.batchCreateDependentVariables(
            dependentVariables,
            context,
            tx,
          )
        }
        return Promise.resolve()
      })
  }

  persistVariables(experimentId,
    independentAndExogenousVariables,
    dependentVariables,
    context,
    tx) {
    return this.persistVariablesWithLevels(
      experimentId,
      independentAndExogenousVariables,
      context,
      tx,
    ).then(() => this.persistVariablesWithoutLevels(experimentId, dependentVariables, context, tx))
  }

  @Transactional('persistAllVariables')
  persistAllVariables(experimentVariables, context, tx) {
    const experimentId = experimentVariables.experimentId
    return this.securityService.permissionsCheck(experimentId, context, tx)
      .then(() => this.variablesValidator.validate(experimentVariables, 'POST', tx)
        .then(() => this.persistVariables(
          experimentId,
          FactorDependentCompositeService.mapIndependentAndExogenousVariableDTO2Entity(
            experimentId,
            experimentVariables.independent,
            experimentVariables.exogenous,
          ),
          FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(
            experimentVariables.dependent,
            experimentId,
          ),
          context,
          tx)
          .then(() => AppUtil.createPostResponse([{ id: experimentId }]))))
  }
}

module.exports = FactorDependentCompositeService

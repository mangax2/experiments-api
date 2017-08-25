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

  @Transactional('getFactorsWithLevels')
  static getFactorsWithLevels(experimentId, tx) {
    return Promise.all([
      FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId, tx),
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId, tx),
    ]).then(data => ({
      factors: data[0],
      levels: data[1],
    }))
  }

  static extractLevelsForFactor(factor, allLevelsForAllFactors) {
    return _.filter(allLevelsForAllFactors, level =>
      Number(level.factor_id) === Number(factor.id),
    )
  }

  static appendLevelIdToLevel(level) {
    return {
      id: level.id,
      items: level.value.items,
    }
  }

  static findFactorType(factorTypes, factor) {
    return _.find(factorTypes, { id: factor.ref_factor_type_id }).type.toLowerCase()
  }

  static assembleFactorLevelDTOs(factor, allFactorLevels) {
    return _.map(
      FactorDependentCompositeService.extractLevelsForFactor(factor, allFactorLevels),
      level => FactorDependentCompositeService.appendLevelIdToLevel(level))
  }

  static mapFactorEntitiesToFactorDTOs(factors, allFactorLevels, allFactorTypes) {
    return _.map(factors, factor => ({
      id: factor.id,
      name: factor.name,
      type: FactorDependentCompositeService.findFactorType(allFactorTypes, factor),
      levels: FactorDependentCompositeService.assembleFactorLevelDTOs(factor, allFactorLevels),
      tier: factor.tier,
    }))
  }

  static mapDependentVariablesEntitiesToDTOs(dependentVariableEntities) {
    return _.map(dependentVariableEntities, dependentVariable => ({
      name: dependentVariable.name,
      required: dependentVariable.required,
      questionCode: dependentVariable.question_code,
    }))
  }

  static createVariablesObject({ independent = [], exogenous = [] }, dependent = []) {
    return { independent, exogenous, dependent }
  }

  static assembleIndependentAndExogenous(factorDTOs) {
    return _.mapValues(_.groupBy(factorDTOs, factor => factor.type),
      factorsOfType => _.map(factorsOfType,
        factorOfType => _.omit(factorOfType, 'type')))
  }

  static assembleVariablesObject(
    factorEntities, allFactorLevels, factorTypes, dependentVariableEntities) {
    const factorDTOs = FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs(
      factorEntities, allFactorLevels, factorTypes)

    return FactorDependentCompositeService.createVariablesObject(
      FactorDependentCompositeService.assembleIndependentAndExogenous(factorDTOs),
      FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs(
        dependentVariableEntities))
  }

  @Transactional('getAllVariablesByExperimentId')
  getAllVariablesByExperimentId(experimentId, isTemplate, tx) {
    return Promise.all(
      [
        FactorDependentCompositeService.getFactorsWithLevels(experimentId, tx),
        this.factorTypeService.getAllFactorTypes(tx),
        this.dependentVariableService.getDependentVariablesByExperimentId(
          experimentId, isTemplate, tx),
      ],
    ).then(results => FactorDependentCompositeService.assembleVariablesObject(
      results[0].factors,
      results[0].levels,
      results[1],
      results[2],
    ))
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

  static mapDependentVariableDTO2DbEntity(dependentVariables, experimentId) {
    return _.map(dependentVariables, (dependentVariable) => {
      dependentVariable.experimentId = experimentId
      return dependentVariable
    })
  }

  persistVariablesWithoutLevels(experimentId, dependentVariables, context, isTemplate, tx) {
    return this.dependentVariableService.deleteDependentVariablesForExperimentId(experimentId,
      isTemplate, tx)
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

  static determineDataSourceId(factorLevelDTOs) {
    const maxItemCount =
      _.chain(factorLevelDTOs)
        .map(factorLevelDTO => _.size(factorLevelDTO.items))
        .max()
        .value()

    const distinctPropertyTypes =
      _.chain(factorLevelDTOs)
        .map(factorLevelDTO => factorLevelDTO.items)
        .flatten()
        .map('propertyTypeId')
        .uniq()
        .value()

    return _.size(distinctPropertyTypes) === 1 && maxItemCount === 1
      ? distinctPropertyTypes[0] : -1 // TODO: Add a value for Custom
  }

  static mapLevelDTOsToLevelEntities(factorId, levelDTOs) {
    return _.map(levelDTOs, level => ({
      id: level.id,
      value: _.omit(level, 'id'),
      factorId,
    }))
  }

  batchCreateFactorsAndDependentLevels(factorInsertsAndFactorDependentLevelInserts, context, tx) {
    if (_.size(factorInsertsAndFactorDependentLevelInserts) > 0) {
      const factorInsertsWithoutLevels =
        _.map(factorInsertsAndFactorDependentLevelInserts,
            factor => _.omit(factor, 'levels'))

      return this.factorService.batchCreateFactors(
        factorInsertsWithoutLevels, context, tx).then((batchCreateFactorResponse) => {
          const factorIds = _.map(batchCreateFactorResponse, r => r.id)
          const levelsWithNewFactorIds =
            _.flatten(
              _.zipWith(factorIds, factorInsertsAndFactorDependentLevelInserts,
                (id, insertedFactor) => _.map(
                  insertedFactor.levels, level => _.extend(level, { factorId: id }))))
          if (_.size(levelsWithNewFactorIds) > 0) {
            return this.factorLevelService.batchCreateFactorLevels(
              levelsWithNewFactorIds, context, tx)
          }

          return Promise.resolve()
        })
    }

    return Promise.resolve()
  }

  batchCreateFactorLevels(levelInsertsIndependentOfFactorInserts, context, tx) {
    if (_.size(levelInsertsIndependentOfFactorInserts) > 0) {
      return this.factorLevelService.batchCreateFactorLevels(
        levelInsertsIndependentOfFactorInserts, context, tx)
    }
    return Promise.resolve()
  }

  batchUpdateFactors(factorUpdates, context, tx) {
    if (_.size(factorUpdates) > 0) {
      const factorUpdatesWithoutLevels = _.map(factorUpdates, factor => _.omit(factor, 'levels'))
      return this.factorService.batchUpdateFactors(
        factorUpdatesWithoutLevels, context, tx)
    }
    return Promise.resolve()
  }

  batchUpdateFactorLevels(levelUpdates, context, tx) {
    if (_.size(levelUpdates) > 0) {
      return this.factorLevelService.batchUpdateFactorLevels(levelUpdates, context, tx)
    }
    return Promise.resolve()
  }

  static determineIdsOfFactorsToDelete(existingFactors, factorEntitiesFromRequest) {
    const existingFactorIds =
      _.map(existingFactors, existingFactorEntity => existingFactorEntity.id)
    const factorIdsFromRequest =
      _.chain(factorEntitiesFromRequest)
        .map(newFactorEntity => newFactorEntity.id)
        .filter(factorId => !(_.isUndefined(factorId) || _.isNull(factorId)))
        .value()
    return _.difference(existingFactorIds, factorIdsFromRequest)
  }

  static determineIdsOfFactorLevelsToDelete(existingLevels, levelEntitiesFromRequest) {
    const existingLevelIds = _.map(existingLevels, existingLevel => existingLevel.id)
    const levelIdsFromRequest =
      _.chain(levelEntitiesFromRequest)
        .map(newLevel => newLevel.id)
        .filter(levelId => !(_.isUndefined(levelId) || _.isNull(levelId)))
        .value()
    return _.difference(existingLevelIds, levelIdsFromRequest)
  }

  persistIndependentVariables(independentVariables, experimentId, context, tx) {
    return FactorDependentCompositeService.getFactorsWithLevels(experimentId, tx).then((data) => {
      const factorEntitiesFromRequest = _.map(independentVariables, factorDTO => ({
        id: factorDTO.id,
        name: factorDTO.name,
        refFactorTypeId: FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID,
        experimentId,
        tier: factorDTO.tier,
        refDataSourceId:
          FactorDependentCompositeService.determineDataSourceId(factorDTO.levels),
        levels: FactorDependentCompositeService.mapLevelDTOsToLevelEntities(
          factorDTO.id, factorDTO.levels),
      }))

      const levelEntitiesFromRequest = _.flatten(
        _.map(factorEntitiesFromRequest, factorEntityFromRequest => factorEntityFromRequest.levels))


      // Determine inserts, updates, and deletes for factors
      const factorInsertsAndFactorDependentLevelInserts = _.filter(factorEntitiesFromRequest,
          factorEntity => _.isNull(factorEntity.id) || _.isUndefined(factorEntity.id))

      const factorUpdates = _.filter(factorEntitiesFromRequest,
          factorEntity => !(_.isNull(factorEntity.id) || _.isUndefined(factorEntity.id)))

      const idsOfFactorsToDelete =
        FactorDependentCompositeService.determineIdsOfFactorsToDelete(
          data.factors, factorEntitiesFromRequest)


      // Determine inserts, updates, and deletes for factor levels
      const levelInsertsIndependentOfFactorInserts = _.filter(levelEntitiesFromRequest,
        levelEntity => (_.isNull(levelEntity.id) || _.isUndefined(levelEntity.id))
          && !(_.isNull(levelEntity.factorId) || _.isUndefined(levelEntity.factorId)))

      const levelUpdates = _.filter(levelEntitiesFromRequest,
          levelEntity => !(_.isNull(levelEntity.id) || _.isUndefined(levelEntity.id)))

      const idsOfLevelsToDelete =
        FactorDependentCompositeService.determineIdsOfFactorLevelsToDelete(
          data.levels, levelEntitiesFromRequest)

      // Execute the inserts, updates, and deletes
      return this.factorLevelService.batchDeleteFactorLevels(idsOfLevelsToDelete, tx)
        .then(() => this.factorService.batchDeleteFactors(idsOfFactorsToDelete, tx)
          .then(() => Promise.all([
            this.batchCreateFactorsAndDependentLevels(
              factorInsertsAndFactorDependentLevelInserts, context, tx),
            this.batchCreateFactorLevels(
              levelInsertsIndependentOfFactorInserts, context, tx)])
            .then(() => Promise.all([
              this.batchUpdateFactors(factorUpdates, context, tx),
              this.batchUpdateFactorLevels(levelUpdates, context, tx)]))))
    })
  }

  persistDependentVariables(dependentVariables, experimentId, context, isTemplate, tx) {
    const dependentVariableEntities =
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(
        dependentVariables, experimentId)
    return this.persistVariablesWithoutLevels(
      experimentId, dependentVariableEntities, context, isTemplate, tx)
  }

  @Transactional('persistAllVariables')
  persistAllVariables(experimentVariables, experimentId, context, isTemplate, tx) {
    const expId = Number(experimentId)
    return this.securityService.permissionsCheck(expId, context, isTemplate, tx)
      .then(() => this.variablesValidator.validate(experimentVariables, 'POST', tx)
        .then(() => Promise.all([
          this.persistIndependentVariables(
            experimentVariables.independent, expId, context, tx),
          this.persistDependentVariables(
            experimentVariables.dependent, expId, context, isTemplate, tx),
        ])).then(() => AppUtil.createPostResponse([{ id: expId }])))
  }
}

module.exports = FactorDependentCompositeService

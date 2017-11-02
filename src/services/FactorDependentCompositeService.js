import * as _ from 'lodash'
import AppUtil from './utility/AppUtil'
import ExperimentsService from './ExperimentsService'
import FactorLevelService from './FactorLevelService'
import FactorService from './FactorService'
import DependentVariableService from './DependentVariableService'
import FactorTypeService from './FactorTypeService'
import SecurityService from './SecurityService'
import RefDataSourceService from './RefDataSourceService'
import Transactional from '../decorators/transactional'
import VariablesValidator from '../validations/VariablesValidator'
import FactorLevelAssociationService from './FactorLevelAssociationService'


class FactorDependentCompositeService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.factorLevelService = new FactorLevelService()
    this.factorLevelAssociationService = new FactorLevelAssociationService()
    this.factorService = new FactorService()
    this.dependentVariableService = new DependentVariableService()
    this.factorTypeService = new FactorTypeService()
    this.securityService = new SecurityService()
    this.refDataSourceService = new RefDataSourceService()
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

  static assembleFactorLevelDTOs(factor, factorLevels) {
    return _.map(
      factorLevels,
      level => FactorDependentCompositeService.appendLevelIdToLevel(level))
  }

  static mapFactorEntitiesToFactorDTOs(
    factors, allFactorLevels, allFactorTypes, factorLevelAssociationEntities) {
    const hashTables = {
      factorHashById: _.keyBy(factors, 'id'),
      factorLevelHashById: _.keyBy(allFactorLevels, 'id'),
      associationsGroupedByNestedLevelId:
        _.groupBy(factorLevelAssociationEntities, 'nested_level_id'),
      associationsGroupedByAssociatedLevelId:
        _.groupBy(factorLevelAssociationEntities, 'associated_level_id'),
    }
    return _.map(factors, (factor) => {
      const factorLevels = FactorDependentCompositeService.extractLevelsForFactor(
        factor, allFactorLevels)
      const nestedFactorIds = _.uniq(_.flatMap(factorLevels,
        (factorLevel) => {
          const associations =
            hashTables.associationsGroupedByAssociatedLevelId[factorLevel.id]
          if (!_.isEmpty(associations)) {
            return _.map(associations, association =>
              hashTables.factorLevelHashById[association.nested_level_id].factor_id)
          }
          return []
        }))
      const nestedFactorDTOs = _.map(nestedFactorIds, (factorId) => {
        const factorMatch = hashTables.factorHashById[factorId]
        return {
          id: factorMatch.id,
          name: factorMatch.name,
        }
      })
      const associatedFactorIds = _.uniq(_.flatMap(factorLevels,
        (factorLevel) => {
          const associations =
            hashTables.associationsGroupedByNestedLevelId[factorLevel.id]
          if (!_.isEmpty(associations)) {
            return _.map(associations, association =>
              hashTables.factorLevelHashById[association.associated_level_id].factor_id)
          }
          return []
        }))
      const associatedFactorDTOs = _.map(associatedFactorIds, (factorId) => {
        const factorMatch = hashTables.factorHashById[factorId]
        return {
          id: factorMatch.id,
          name: factorMatch.name,
        }
      })
      return {
        id: factor.id,
        name: factor.name,
        nestedFactors: _.isEmpty(nestedFactorDTOs) ? undefined : nestedFactorDTOs,
        associatedFactors: _.isEmpty(associatedFactorDTOs) ? undefined : associatedFactorDTOs,
        type: FactorDependentCompositeService.findFactorType(allFactorTypes, factor),
        levels: FactorDependentCompositeService.assembleFactorLevelDTOs(
          factor, factorLevels),
        tier: factor.tier,
      }
    })
  }

  static mapDependentVariablesEntitiesToDTOs(dependentVariableEntities) {
    return _.map(dependentVariableEntities, dependentVariable => ({
      name: dependentVariable.name,
      required: dependentVariable.required,
      questionCode: dependentVariable.question_code,
    }))
  }

  static mapFactorLevelAssociationEntitiesToDTOs(factorLevelAssociationEntities) {
    return _.map(factorLevelAssociationEntities, factorLevelAssociationEntity => ({
      id: factorLevelAssociationEntity.id,
      associatedLevelId: factorLevelAssociationEntity.associated_level_id,
      nestedLevelId: factorLevelAssociationEntity.nested_level_id,
    }))
  }

  static createVariablesObject(
    { independent = [], exogenous = [] },
    dependent = [],
    independentAssociations = []) {
    return { independent, exogenous, dependent, independentAssociations }
  }

  static assembleIndependentAndExogenous(factorDTOs) {
    return _.mapValues(_.groupBy(factorDTOs, factor => factor.type),
      factorsOfType => _.map(factorsOfType,
        factorOfType => _.omit(factorOfType, 'type')))
  }

  static assembleVariablesObject(
    factorEntities, allFactorLevels, factorTypes, dependentVariableEntities,
    factorLevelAssociationEntities) {
    const factorDTOs = FactorDependentCompositeService.mapFactorEntitiesToFactorDTOs(
      factorEntities, allFactorLevels, factorTypes, factorLevelAssociationEntities)
    return FactorDependentCompositeService.createVariablesObject(
      FactorDependentCompositeService.assembleIndependentAndExogenous(factorDTOs),
      FactorDependentCompositeService.mapDependentVariablesEntitiesToDTOs(
        dependentVariableEntities),
      FactorDependentCompositeService.mapFactorLevelAssociationEntitiesToDTOs(
        factorLevelAssociationEntities))
  }

  @Transactional('getAllVariablesByExperimentId')
  getAllVariablesByExperimentId(experimentId, isTemplate, tx) {
    return Promise.all(
      [
        ExperimentsService.verifyExperimentExists(experimentId, isTemplate, tx),
        FactorDependentCompositeService.getFactorsWithLevels(experimentId, tx),
        this.factorTypeService.getAllFactorTypes(tx),
        DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck(
          experimentId, tx),
        FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(
          experimentId, tx),
      ],
    ).then(results => FactorDependentCompositeService.assembleVariablesObject(
      results[1].factors,
      results[1].levels,
      results[2],
      results[3],
      results[4],
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

  static determineDataSourceId(factorLevelDTOs, allDataSources) {
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
      ? distinctPropertyTypes[0] : _.find(allDataSources,
          dataSource => dataSource.name === 'Custom').id
  }

  persistDependentVariables(dependentVariables, experimentId, context, isTemplate, tx) {
    const dependentVariableEntities =
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(
        dependentVariables, experimentId)
    return this.persistVariablesWithoutLevels(
      experimentId, dependentVariableEntities, context, isTemplate, tx)
  }

  static extractIds(sources) {
    return _.compact(_.map(sources, 'id'))
  }

  deleteLevelsHavingIds = (levelIds, tx) => (_.isEmpty(levelIds)
      ? Promise.resolve([])
      : this.factorLevelService.batchDeleteFactorLevels(levelIds, tx))

  deleteFactorsHavingIds = (factorIds, tx) => (_.isEmpty(factorIds)
      ? Promise.resolve([])
      : this.factorService.batchDeleteFactors(factorIds, tx))

  static applyAsyncBatchOperationToNonEmptyArray(asyncBatchFunction, entities, context, tx) {
    return _.isEmpty(entities)
      ? Promise.resolve([])
      : asyncBatchFunction(entities, context, tx)
  }

  static mapFactorLevelDTOsToFactorLevelEntities(allLevelDTOsWithParentFactorId) {
    return _.map(allLevelDTOsWithParentFactorId, level => ({
      id: level.id,
      value: { items: level.items },
      factorId: level.factorId,
    }))
  }

  static mapFactorDTOsToFactorEntities(experimentId, factorDTOs, refFactorTypeId, allDataSources) {
    return _.map(factorDTOs, factorDTO => ({
      id: factorDTO.id,
      name: factorDTO.name,
      refFactorTypeId,
      experimentId,
      tier: factorDTO.tier,
      refDataSourceId:
        FactorDependentCompositeService.determineDataSourceId(factorDTO.levels, allDataSources),
    }))
  }

  static appendParentIdToChildren(parents, childArrayPropertyName, nameOfNewIdProperty) {
    return _.map(parents,
        parent => ({
          [childArrayPropertyName]: _.map(parent[childArrayPropertyName],
            child => ({ [nameOfNewIdProperty]: parent.id, ...child })),
          ..._.omit(parent, childArrayPropertyName),
        }))
  }

  static concatChildArrays(parents, childArrayPropertyName) {
    return _.concat(..._.map(parents, parent => parent[childArrayPropertyName]))
  }

  static determineIdsToDelete(dbEntities, DTOs) {
    return _.difference(
      FactorDependentCompositeService.extractIds(dbEntities),
      FactorDependentCompositeService.extractIds(DTOs),
    )
  }

  static batchDeleteDbEntitiesWithoutMatchingDTO(dbEntities, DTOs, asyncBatchDeleteFunction, tx) {
    return asyncBatchDeleteFunction(
      FactorDependentCompositeService.determineIdsToDelete(dbEntities, DTOs), tx)
  }

  deleteFactorsAndLevels = (allDbFactors, allDbLevels, allFactorDTOs, allLevelDTOs, tx) => {
    const C = FactorDependentCompositeService
    return C.batchDeleteDbEntitiesWithoutMatchingDTO(
      allDbLevels, allLevelDTOs, this.deleteLevelsHavingIds, tx).then(
      () => C.batchDeleteDbEntitiesWithoutMatchingDTO(
        allDbFactors, allFactorDTOs, this.deleteFactorsHavingIds, tx))
  }

  static determineDTOsForUpdate(DTOs) {
    return _.filter(DTOs, dto => !_.isNil(dto.id))
  }

  static determineDTOsForCreate(DTOs) {
    return _.filter(DTOs, dto => _.isNil(dto.id))
  }

  updateFactors = (experimentId, allFactorDTOs, allDataSources, context, tx) => {
    const C = FactorDependentCompositeService
    return C.applyAsyncBatchOperationToNonEmptyArray(
      this.factorService.batchUpdateFactors,
      C.mapFactorDTOsToFactorEntities(
        experimentId,
        C.determineDTOsForUpdate(allFactorDTOs),
        C.INDEPENDENT_VARIABLE_TYPE_ID,
        allDataSources),
      context,
      tx)
  }

  updateLevels = (levelDTOsForUpdate, context, tx) => {
    const C = FactorDependentCompositeService
    return C.applyAsyncBatchOperationToNonEmptyArray(
      this.factorLevelService.batchUpdateFactorLevels,
      C.mapFactorLevelDTOsToFactorLevelEntities(levelDTOsForUpdate),
      context,
      tx)
  }

  updateFactorsAndLevels = (
    experimentId, allDataSources, allFactorDTOs,
    levelDTOsWithParentFactorIdForUpdate, context, tx) => Promise.all([
      this.updateFactors(experimentId, allFactorDTOs, allDataSources, context, tx),
      this.updateLevels(levelDTOsWithParentFactorIdForUpdate, context, tx),
    ])

  createFactorsAndDependentLevels = (
    experimentId, allDataSources, factorDTOsForCreate, context, tx) => {
    const C = FactorDependentCompositeService
    const factorEntitiesForCreate = C.mapFactorDTOsToFactorEntities(
      experimentId, factorDTOsForCreate,
      FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID, allDataSources)
    return C.applyAsyncBatchOperationToNonEmptyArray(
      this.factorService.batchCreateFactors,
      factorEntitiesForCreate,
      context,
      tx)
      .then((responses) => {
        const levelDTOsWithFactorIdForCreate =
          _.flatMap(factorDTOsForCreate, (factorDTO, index) =>
            _.map(factorDTO.levels, level => ({ factorId: responses[index].id, ...level })))
        return this.createFactorLevels(
          experimentId, allDataSources, levelDTOsWithFactorIdForCreate, context, tx)
      })
  }

  createFactorLevelsForPreExistingFactors(
    experimentId, allDataSources, levelDTOsWithFactorIdForCreate, context, tx) {
    return this.createFactorLevels(
      experimentId, allDataSources, levelDTOsWithFactorIdForCreate, context, tx)
  }

  createFactorLevels = (experimentId, allDataSources, allFactorLevelDTOs, context, tx) => {
    const C = FactorDependentCompositeService
    return C.applyAsyncBatchOperationToNonEmptyArray(
      this.factorLevelService.batchCreateFactorLevels,
      C.mapFactorLevelDTOsToFactorLevelEntities(C.determineDTOsForCreate(allFactorLevelDTOs)),
      context,
      tx)
  }

  static mapFactorLevelAssociationDTOToEntity(refIdToIdMap, DTOs) {
    return _.map(DTOs, dto => ({
      associatedLevelId: refIdToIdMap[dto.associatedLevelRefId],
      nestedLevelId: refIdToIdMap[dto.nestedLevelRefId],
    }))
  }

  static determineFactorLevelAssociationIdsToDelete(
    refIdToIdMap,
    factorLevelAssociationEntities,
    factorLevelAssociationDTOs) {
    const C = FactorDependentCompositeService
    return _.map(_.differenceWith(
      factorLevelAssociationEntities,
      C.mapFactorLevelAssociationDTOToEntity(refIdToIdMap, factorLevelAssociationDTOs),
      (a, b) => (a.associated_level_id === b.associatedLevelId
        && a.nested_level_id === b.nestedLevelId)), 'id')
  }

  static determineFactorLevelAssociationEntitiesToCreate(
    refIdToIdMap,
    factorLevelAssociationEntities,
    factorLevelAssociationDTOs) {
    const C = FactorDependentCompositeService
    return _.differenceWith(
      C.mapFactorLevelAssociationDTOToEntity(refIdToIdMap, factorLevelAssociationDTOs),
      factorLevelAssociationEntities,
      (a, b) => a.associatedLevelId === b.associated_level_id
        && a.nestedLevelId === b.nested_level_id)
  }

  static deleteFactorLevelAssociations(
    refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs, tx) {
    const C = FactorDependentCompositeService
    const idsToDelete = C.determineFactorLevelAssociationIdsToDelete(
      refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs)
    return _.isEmpty(idsToDelete)
      ? Promise.resolve()
      : FactorLevelAssociationService.batchDeleteFactorLevelAssociations(
        idsToDelete,
        tx)
  }

  createFactorLevelAssociations = (
    refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs, context, tx) => {
    const C = FactorDependentCompositeService
    return C.applyAsyncBatchOperationToNonEmptyArray(
      this.factorLevelAssociationService.batchCreateFactorLevelAssociations,
      C.determineFactorLevelAssociationEntitiesToCreate(
        refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs),
      context,
      tx)
  }

  static createRefIdToIdMap(refIdSource, idSource) {
    return _.zipObject(
      _.map(refIdSource, '_refId'),
      _.map(idSource, 'id'))
  }

  createCompleteRefIdToIdMap = (
    {
      factorDependentLevelDTOsForCreate,
      factorIndependentLevelDTOsForCreate,
      allLevelDTOsWithParentFactorIdForUpdate,
    },
    dependentLevelResponses,
    independentLevelResponses) => {
    const C = FactorDependentCompositeService
    return _.assign(
      C.createRefIdToIdMap(
        factorDependentLevelDTOsForCreate,
        dependentLevelResponses),
      C.createRefIdToIdMap(
        factorIndependentLevelDTOsForCreate,
        independentLevelResponses),
      C.createRefIdToIdMap(
        allLevelDTOsWithParentFactorIdForUpdate,
        allLevelDTOsWithParentFactorIdForUpdate))
  }

  static formDbEntitiesObject(
    [allDbRefDataSources, allDbFactors, allDbLevels, allDbFactorLevelAssociations]) {
    return { allDbRefDataSources, allDbFactors, allDbLevels, allDbFactorLevelAssociations }
  }

  getCurrentDbEntities = (experimentId, tx) => Promise.all([
    this.refDataSourceService.getRefDataSources(),
    FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId, tx),
    FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId, tx),
    FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(experimentId, tx)])
    .then(FactorDependentCompositeService.formDbEntitiesObject)

  categorizeRequestDTOs = (allIndependentDTOs) => {
    const C = FactorDependentCompositeService
    const allLevelDTOsWithParentFactorId = C.concatChildArrays(
      C.appendParentIdToChildren(allIndependentDTOs, 'levels', 'factorId'),
      'levels')
    return {
      allLevelDTOsWithParentFactorId,
      allLevelDTOsWithParentFactorIdForUpdate:
        C.determineDTOsForUpdate(allLevelDTOsWithParentFactorId),
      factorDTOsForCreate: C.determineDTOsForCreate(allIndependentDTOs),
      factorDependentLevelDTOsForCreate:
        _.filter(allLevelDTOsWithParentFactorId,
          dto => _.isNil(dto.factorId)),
      factorIndependentLevelDTOsForCreate:
        _.filter(allLevelDTOsWithParentFactorId,
          dto => !_.isNil(dto.factorId) && _.isNil(dto.id)),
    }
  }

  createFactorsAndLevels = (
    experimentId,
    { allDbRefDataSources }, // DB Entities
    { factorDTOsForCreate, factorIndependentLevelDTOsForCreate }, // Request Entities
    context, tx) => Promise.all([
      this.createFactorsAndDependentLevels(
        experimentId,
        allDbRefDataSources,
        factorDTOsForCreate,
        context, tx),
      this.createFactorLevelsForPreExistingFactors(
        experimentId,
        allDbRefDataSources,
        factorIndependentLevelDTOsForCreate,
        context, tx)])

  persistIndependentAndAssociations =
    (experimentId, allIndependentDTOs, allFactorLevelAssociationDTOs, context, tx) => {
      const C = FactorDependentCompositeService
      return this.getCurrentDbEntities(experimentId, tx).then(
        (dbEntities) => {
          const categorizedRequestDTOs = this.categorizeRequestDTOs(allIndependentDTOs)
          return this.deleteFactorsAndLevels(
            dbEntities.allDbFactors, dbEntities.allDbLevels,
            allIndependentDTOs, categorizedRequestDTOs.allLevelDTOsWithParentFactorId,
            tx)
            .then(() => this.updateFactorsAndLevels(
              experimentId,
              dbEntities.allDbRefDataSources,
              allIndependentDTOs,
              categorizedRequestDTOs.allLevelDTOsWithParentFactorIdForUpdate,
              context, tx))
            .then(() => this.createFactorsAndLevels(
              experimentId, dbEntities, categorizedRequestDTOs, context, tx))
            .then(([dependentLevelResponses, independentLevelResponses]) => {
              const finalRefIdMap = this.createCompleteRefIdToIdMap(
                categorizedRequestDTOs, dependentLevelResponses, independentLevelResponses)
              return Promise.all([
                C.deleteFactorLevelAssociations(
                  finalRefIdMap,
                  dbEntities.allDbFactorLevelAssociations,
                  allFactorLevelAssociationDTOs,
                  tx),
                this.createFactorLevelAssociations(
                  finalRefIdMap,
                  dbEntities.allDbFactorLevelAssociations,
                  allFactorLevelAssociationDTOs,
                  context, tx),
              ])
            })
        })
    }

  persistIndependentAndDependentVariables = (
    experimentId, independent, independentAssociations,
    dependent, context, isTemplate, tx) => Promise.all([
      this.persistIndependentAndAssociations(
        experimentId, independent, independentAssociations, context, tx),
      this.persistDependentVariables(
        dependent, experimentId, context, isTemplate, tx)])

  @Transactional('persistAllVariables')
  persistAllVariables(experimentVariables, experimentId, context, isTemplate, tx) {
    const expId = Number(experimentId)
    return this.securityService.permissionsCheck(expId, context, isTemplate, tx)
      .then(() => this.variablesValidator.validate(experimentVariables, 'POST', tx))
      .then(() => this.persistIndependentAndDependentVariables(
        expId,
        experimentVariables.independent,
        experimentVariables.independentAssociations,
        experimentVariables.dependent,
        context,
        isTemplate,
        tx))
      .then(() => AppUtil.createPostResponse([{ id: expId }]))
  }
}

module.exports = FactorDependentCompositeService

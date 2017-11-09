import * as _ from 'lodash'
import AppUtil from './utility/AppUtil'
import ExperimentsService from './ExperimentsService'
import FactorLevelService from './FactorLevelService'
import FactorService from './FactorService'
import DependentVariableService from './DependentVariableService'
import FactorLevelAssociationEntityUtil from '../repos/util/FactorLevelAssociationEntityUtil'
import FactorLevelEntityUtil from '../repos/util/FactorLevelEntityUtil'
import FactorTypeService from './FactorTypeService'
import SecurityService from './SecurityService'
import RefDataSourceService from './RefDataSourceService'
import Transactional from '../decorators/transactional'
import VariablesValidator from '../validations/VariablesValidator'
import FactorLevelAssociationService from './FactorLevelAssociationService'

const INDEPENDENT_VARIABLE_FACTOR_TYPE = 'Independent'

function getIdForFactorType(allFactorTypes, type) {
  return _.find(allFactorTypes, factorType => factorType.type === type).id
}

function extractIds(sources) {
  return _.compact(_.map(sources, 'id'))
}

function determineIdsToDelete(dbEntities, DTOs) {
  return _.difference(
    extractIds(dbEntities),
    extractIds(DTOs),
  )
}

function determineDTOsForUpdate(DTOs) {
  return _.filter(DTOs, dto => !_.isNil(dto.id))
}

function determineDTOsForCreate(DTOs) {
  return _.filter(DTOs, dto => _.isNil(dto.id))
}

function applyAsyncBatchToNonEmptyArray(
  asyncBatchFunction, ids, ...contextAndTx) {
  return _.isEmpty(ids)
    ? Promise.resolve([])
    : asyncBatchFunction(ids, ...contextAndTx)
}

function batchDeleteDbEntitiesWithoutMatchingDTO(
  dbEntities, DTOs, asyncBatchDeleteFunction, tx) {
  return applyAsyncBatchToNonEmptyArray(
    asyncBatchDeleteFunction,
    determineIdsToDelete(dbEntities, DTOs),
    tx)
}

function formDbEntitiesObject(
  [allDbRefDataSources, allDbFactors, allDbLevels,
    allDbFactorLevelAssociations, allFactorTypes]) {
  return {
    allDbRefDataSources, allDbFactors, allDbLevels, allDbFactorLevelAssociations, allFactorTypes,
  }
}

function createRefIdToIdMap(refIdSource, idSource) {
  return _.zipObject(
    _.map(refIdSource, '_refId'),
    _.map(idSource, 'id'))
}

function createCompleteRefIdToIdMap(
  {
    factorDependentLevelDTOsForCreate,
    factorIndependentLevelDTOsForCreate,
    allLevelDTOsWithParentFactorIdForUpdate,
    dependentLevelResponses,
    independentLevelResponses,
  }) {
  return _.assign(
    createRefIdToIdMap(
      factorDependentLevelDTOsForCreate,
      dependentLevelResponses),
    createRefIdToIdMap(
      factorIndependentLevelDTOsForCreate,
      independentLevelResponses),
    createRefIdToIdMap(
      allLevelDTOsWithParentFactorIdForUpdate,
      allLevelDTOsWithParentFactorIdForUpdate))
}

function mapFactorLevelAssociationDTOToEntity(refIdToIdMap, DTOs) {
  return _.map(DTOs, dto => ({
    associatedLevelId: refIdToIdMap[dto.associatedLevelRefId],
    nestedLevelId: refIdToIdMap[dto.nestedLevelRefId],
  }))
}

function determineFactorLevelAssociationIdsToDelete(
  refIdToIdMap,
  factorLevelAssociationEntities,
  factorLevelAssociationDTOs) {
  return _.map(_.differenceWith(
    factorLevelAssociationEntities,
    mapFactorLevelAssociationDTOToEntity(refIdToIdMap, factorLevelAssociationDTOs),
    (a, b) => (a.associated_level_id === b.associatedLevelId
      && a.nested_level_id === b.nestedLevelId)), 'id')
}

function determineFactorLevelAssociationEntitiesToCreate(
  refIdToIdMap,
  factorLevelAssociationEntities,
  factorLevelAssociationDTOs) {
  return _.differenceWith(
    mapFactorLevelAssociationDTOToEntity(refIdToIdMap, factorLevelAssociationDTOs),
    factorLevelAssociationEntities,
    (a, b) => a.associatedLevelId === b.associated_level_id
      && a.nestedLevelId === b.nested_level_id)
}

function deleteFactorLevelAssociations(
  {
    refIdToIdMap,
    allDbFactorLevelAssociations,
    allFactorLevelAssociationDTOs,
    tx,
  }) {
  const idsToDelete = determineFactorLevelAssociationIdsToDelete(
    refIdToIdMap, allDbFactorLevelAssociations, allFactorLevelAssociationDTOs)
  return _.isEmpty(idsToDelete)
    ? Promise.resolve()
    : FactorLevelAssociationService.batchDeleteFactorLevelAssociations(
      idsToDelete,
      tx)
}

function mapFactorLevelDTOsToFactorLevelEntities(allLevelDTOsWithParentFactorId) {
  return _.map(allLevelDTOsWithParentFactorId, level => ({
    id: level.id,
    value: { items: level.items },
    factorId: level.factorId,
  }))
}

function mapFactorDTOsToFactorEntities(
  experimentId, factorDTOs, refFactorTypeId, allDataSources) {
  return _.map(factorDTOs, factorDTO => ({
    id: factorDTO.id,
    name: factorDTO.name,
    refFactorTypeId,
    experimentId,
    tier: factorDTO.tier,
    refDataSourceId:
      FactorDependentCompositeService.determineDataSourceId(
        factorDTO.levels, allDataSources),
  }))
}

function appendParentIdToChildren(parents, childArrayPropertyName, nameOfNewIdProperty) {
  return _.map(parents,
    parent => ({
      [childArrayPropertyName]: _.map(parent[childArrayPropertyName],
        child => ({ [nameOfNewIdProperty]: parent.id, ...child })),
      ..._.omit(parent, childArrayPropertyName),
    }))
}

function concatChildArrays(parents, childArrayPropertyName) {
  return _.concat(..._.map(parents, parent => parent[childArrayPropertyName]))
}

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

  static assembleFactorLevelDTOs(factorLevels) {
    return _.map(
      factorLevels,
      level => FactorDependentCompositeService.appendLevelIdToLevel(level))
  }

  static mapFactorEntitiesToFactorDTOs(
    factors, allFactorLevels, allFactorTypes, factorLevelAssociationEntities) {
    const factorHashById = _.keyBy(factors, 'id')
    const factorLevelHashById =
      FactorLevelEntityUtil.assembleFactorLevelHashById(allFactorLevels)
    return _.map(factors, (factor) => {
      const factorLevels = FactorDependentCompositeService.extractLevelsForFactor(
        factor, allFactorLevels)
      const nestedFactorIds =
        FactorLevelAssociationEntityUtil.getNestedFactorIds(
          factorLevels,
          FactorLevelAssociationEntityUtil.assembleAssociationsGroupByAssociatedLevelId(
            factorLevelAssociationEntities),
          factorLevelHashById)
      const nestedFactorDTOs = _.map(nestedFactorIds, (factorId) => {
        const factorMatch = factorHashById[factorId]
        return {
          id: factorMatch.id,
          name: factorMatch.name,
        }
      })
      const associatedFactorIds =
        FactorLevelAssociationEntityUtil.getAssociatedFactorIds(
          factorLevels,
          FactorLevelAssociationEntityUtil.assembleAssociationsGroupedByNestedLevelId(
            factorLevelAssociationEntities),
          factorLevelHashById)
      const associatedFactorDTOs = _.map(associatedFactorIds, (factorId) => {
        const factorMatch = factorHashById[factorId]
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
        levels: FactorDependentCompositeService.assembleFactorLevelDTOs(factorLevels),
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

  deleteFactorsAndLevels =
    ({
       allDbFactors,
       allDbLevels,
       allIndependentDTOs: allFactorDTOs,
       allLevelDTOsWithParentFactorId: allLevelDTOs,
       tx,
    }) =>
      batchDeleteDbEntitiesWithoutMatchingDTO(
        allDbLevels, allLevelDTOs, this.factorLevelService.batchDeleteFactorLevels, tx)
        .then(() => batchDeleteDbEntitiesWithoutMatchingDTO(
          allDbFactors, allFactorDTOs, this.factorService.batchDeleteFactors, tx))

  updateFactors =
    (experimentId, allFactorDTOs, allDataSources, allFactorTypes, context, tx) =>
      applyAsyncBatchToNonEmptyArray(
        this.factorService.batchUpdateFactors,
        mapFactorDTOsToFactorEntities(
          experimentId,
          determineDTOsForUpdate(allFactorDTOs),
          getIdForFactorType(allFactorTypes, INDEPENDENT_VARIABLE_FACTOR_TYPE),
          allDataSources),
        context,
        tx)

  updateLevels = (levelDTOsForUpdate, context, tx) => applyAsyncBatchToNonEmptyArray(
      this.factorLevelService.batchUpdateFactorLevels,
      mapFactorLevelDTOsToFactorLevelEntities(levelDTOsForUpdate),
      context,
      tx)

  updateFactorsAndLevels = ({ experimentId, allDbRefDataSources, allIndependentDTOs: allFactorDTOs,
    allLevelDTOsWithParentFactorIdForUpdate, allFactorTypes, context, tx }) => Promise.all([
      this.updateFactors(
        experimentId, allFactorDTOs, allDbRefDataSources, allFactorTypes, context, tx),
      this.updateLevels(allLevelDTOsWithParentFactorIdForUpdate, context, tx),
    ])

  createFactorsAndDependentLevels = (
    { experimentId, allDbRefDataSources, factorDTOsForCreate, allFactorTypes, context, tx }) => {
    const factorEntitiesForCreate = mapFactorDTOsToFactorEntities(
      experimentId,
      factorDTOsForCreate,
      getIdForFactorType(allFactorTypes, INDEPENDENT_VARIABLE_FACTOR_TYPE),
      allDbRefDataSources)
    return applyAsyncBatchToNonEmptyArray(
      this.factorService.batchCreateFactors,
      factorEntitiesForCreate,
      context,
      tx)
      .then((responses) => {
        const levelDTOsWithFactorIdForCreate =
          _.flatMap(factorDTOsForCreate, (factorDTO, index) =>
            _.map(factorDTO.levels, level => ({ factorId: responses[index].id, ...level })))
        return this.createFactorLevels(levelDTOsWithFactorIdForCreate, context, tx)
      })
  }

  createFactorLevels =
    (allFactorLevelDTOs, context, tx) =>
      applyAsyncBatchToNonEmptyArray(
        this.factorLevelService.batchCreateFactorLevels,
        mapFactorLevelDTOsToFactorLevelEntities(
          determineDTOsForCreate(allFactorLevelDTOs)),
        context,
        tx)

  createFactorLevelAssociations = (
    {
      refIdToIdMap,
      allDbFactorLevelAssociations,
      allFactorLevelAssociationDTOs,
      context,
      tx,
    }) => applyAsyncBatchToNonEmptyArray(
      this.factorLevelAssociationService.batchCreateFactorLevelAssociations,
      determineFactorLevelAssociationEntitiesToCreate(
        refIdToIdMap, allDbFactorLevelAssociations, allFactorLevelAssociationDTOs),
      context,
      tx)

  getCurrentDbEntities = ({ experimentId, tx }) => Promise.all([
    this.refDataSourceService.getRefDataSources(),
    FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId, tx),
    FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId, tx),
    FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(experimentId, tx),
    this.factorTypeService.getAllFactorTypes()])
    .then(formDbEntitiesObject)

  categorizeRequestDTOs = (allIndependentDTOs) => {
    const allLevelDTOsWithParentFactorId = concatChildArrays(
      appendParentIdToChildren(allIndependentDTOs, 'levels', 'factorId'),
      'levels')
    return {
      allLevelDTOsWithParentFactorId,
      allLevelDTOsWithParentFactorIdForUpdate:
        determineDTOsForUpdate(allLevelDTOsWithParentFactorId),
      factorDTOsForCreate: determineDTOsForCreate(allIndependentDTOs),
      factorDependentLevelDTOsForCreate:
        _.filter(allLevelDTOsWithParentFactorId,
          dto => _.isNil(dto.factorId)),
      factorIndependentLevelDTOsForCreate:
        _.filter(allLevelDTOsWithParentFactorId,
          dto => !_.isNil(dto.factorId) && _.isNil(dto.id)),
    }
  }

  createFactorsAndLevels = params => Promise.all([
    this.createFactorsAndDependentLevels(params),
    this.createFactorLevels(
      params.factorIndependentLevelDTOsForCreate,
      params.context,
      params.tx)])

  persistIndependentAndAssociations = (
    experimentId, allIndependentDTOs, allFactorLevelAssociationDTOs, context, tx) => {
    const requestData = {
      experimentId,
      allIndependentDTOs,
      allFactorLevelAssociationDTOs,
      context,
      tx,
    }
    return this.getCurrentDbEntities(requestData).then(
      (dbEntities) => {
        const inputsAndDbEntities = {
          ...requestData,
          ...dbEntities,
          ...this.categorizeRequestDTOs(allIndependentDTOs),
        }
        return this.deleteFactorsAndLevels(inputsAndDbEntities)
          .then(() => this.updateFactorsAndLevels(inputsAndDbEntities))
          .then(() => this.createFactorsAndLevels(inputsAndDbEntities))
          .then(([dependentLevelResponses, independentLevelResponses]) => {
            const refIdToIdMap = createCompleteRefIdToIdMap({
              ...inputsAndDbEntities,
              dependentLevelResponses,
              independentLevelResponses })
            const inputsAndDbEntitiesWithRefIdToIdMap = {
              ...inputsAndDbEntities,
              refIdToIdMap }
            return Promise.all([
              deleteFactorLevelAssociations(inputsAndDbEntitiesWithRefIdToIdMap),
              this.createFactorLevelAssociations(inputsAndDbEntitiesWithRefIdToIdMap),
            ])
          })
      })
  }

  persistIndependentAndDependentVariables = (
    experimentId, variables, context, isTemplate, tx) => Promise.all([
      this.persistIndependentAndAssociations(
        experimentId, variables.independent,
        variables.independentAssociations, context, tx),
      this.persistDependentVariables(
        variables.dependent, experimentId, context, isTemplate, tx)])

  @Transactional('persistAllVariables')
  persistAllVariables(experimentVariables, experimentId, context, isTemplate, tx) {
    const expId = Number(experimentId)
    return this.securityService.permissionsCheck(expId, context, isTemplate, tx)
      .then(() => this.variablesValidator.validate(experimentVariables, 'POST', tx))
      .then(() => this.persistIndependentAndDependentVariables(
        expId, experimentVariables, context, isTemplate, tx))
      .then(() => AppUtil.createPostResponse([{ id: expId }]))
  }
}

module.exports = FactorDependentCompositeService

import * as _ from 'lodash'
import Transactional from '@monsantoit/pg-transactional'
import AppUtil from './utility/AppUtil'
import ExperimentsService from './ExperimentsService'
import FactorLevelService from './FactorLevelService'
import FactorService from './FactorService'
import DependentVariableService from './DependentVariableService'
import FactorLevelAssociationEntityUtil from '../repos/util/FactorLevelAssociationEntityUtil'
import FactorLevelEntityUtil from '../repos/util/FactorLevelEntityUtil'
import FactorTypeService from './FactorTypeService'
import SecurityService from './SecurityService'
import VariablesValidator from '../validations/VariablesValidator'
import FactorLevelAssociationService from './FactorLevelAssociationService'
import { notifyChanges } from '../decorators/notifyChanges'

const { addErrorHandling, setErrorCode } = require('@monsantoit/error-decorator')()

const INDEPENDENT_VARIABLE_FACTOR_TYPE = 'Independent'
// Error Codes 1AXXXX

const getIdForFactorType = addErrorHandling('1A1000',
  (allFactorTypes, type) => _.find(allFactorTypes, factorType => factorType.type === type).id)

const extractIds = addErrorHandling('1A2000',
  sources => _.compact(_.map(sources, 'id')))

const determineIdsToDelete = addErrorHandling('1A3000',
  (dbEntities, DTOs) => _.difference(extractIds(dbEntities), extractIds(DTOs)))


const determineDTOsForUpdate = addErrorHandling('1A4000',
  DTOs => _.filter(DTOs, dto => !_.isNil(dto.id)))

const determineDTOsForCreate = addErrorHandling('1A5000',
  DTOs => _.filter(DTOs, dto => _.isNil(dto.id)))

const applyAsyncBatchToNonEmptyArray = addErrorHandling('1A6000',
  (asyncBatchFunction, ids, ...contextAndTx) =>
    (_.isEmpty(ids) ? Promise.resolve([]) : asyncBatchFunction(ids, ...contextAndTx)))

const batchDeleteDbEntitiesWithoutMatchingDTO = addErrorHandling('1A7000',
  (dbEntities, DTOs, asyncBatchDeleteFunction, context, tx) =>
    applyAsyncBatchToNonEmptyArray(asyncBatchDeleteFunction,
      determineIdsToDelete(dbEntities, DTOs), context, tx))

const formDbEntitiesObject = addErrorHandling('1A8000',
  ([allDbFactors, allDbLevels, allDbFactorLevelAssociations,
    allFactorTypes]) =>
    ({
      allDbFactors,
      allDbLevels,
      allDbFactorLevelAssociations,
      allFactorTypes,
    }))

const createRefIdToIdMap = addErrorHandling('1A9000',
  (refIdSource, idSource) => _.zipObject(_.map(refIdSource, '_refId'), _.map(idSource, 'id')))

const createCompleteRefIdToIdMap = addErrorHandling('1AA000',
  ({
    factorDependentLevelDTOsForCreate,
    factorIndependentLevelDTOsForCreate,
    allLevelDTOsWithParentFactorIdForUpdate,
    dependentLevelResponses,
    independentLevelResponses,
  }) =>
    _.assign(createRefIdToIdMap(factorDependentLevelDTOsForCreate, dependentLevelResponses),
      createRefIdToIdMap(factorIndependentLevelDTOsForCreate, independentLevelResponses),
      createRefIdToIdMap(allLevelDTOsWithParentFactorIdForUpdate,
        allLevelDTOsWithParentFactorIdForUpdate)))

const mapFactorLevelAssociationDTOToEntity = addErrorHandling('1AB000',
  (refIdToIdMap, DTOs) => _.map(DTOs, dto => ({
    associatedLevelId: refIdToIdMap[dto.associatedLevelRefId],
    nestedLevelId: refIdToIdMap[dto.nestedLevelRefId],
  })))

const determineFactorLevelAssociationIdsToDelete = addErrorHandling('1AC000',
  (refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs) =>
    _.map(_.differenceWith(factorLevelAssociationEntities,
      mapFactorLevelAssociationDTOToEntity(refIdToIdMap, factorLevelAssociationDTOs),
      (a, b) => (a.associated_level_id === b.associatedLevelId
        && a.nested_level_id === b.nestedLevelId)), 'id'))

const determineFactorLevelAssociationEntitiesToCreate = addErrorHandling('1AD000', (
  (refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs) =>
    _.differenceWith(
      mapFactorLevelAssociationDTOToEntity(refIdToIdMap, factorLevelAssociationDTOs),
      factorLevelAssociationEntities,
      (a, b) => a.associatedLevelId === b.associated_level_id
        && a.nestedLevelId === b.nested_level_id)))

const deleteFactorLevelAssociations = addErrorHandling('1AE000',
  ({
    refIdToIdMap,
    allDbFactorLevelAssociations,
    allFactorLevelAssociationDTOs,
    tx,
  }) => {
    const idsToDelete = determineFactorLevelAssociationIdsToDelete(
      refIdToIdMap, allDbFactorLevelAssociations, allFactorLevelAssociationDTOs)
    return _.isEmpty(idsToDelete)
      ? Promise.resolve()
      : FactorLevelAssociationService.batchDeleteFactorLevelAssociations(
        idsToDelete,
        tx)
  })

const mapFactorLevelDTOsToFactorLevelEntities = addErrorHandling('1AF000',
  (allLevelDTOsWithParentFactorId, factorLevelAssociations) =>
    _.map(allLevelDTOsWithParentFactorId, level => ({
      id: level.id,
      value: { items: level.items, objectType: level.objectType },
      factorId: level.factorId,
      associatedFactorLevelRefIds: _.map(_.filter(factorLevelAssociations,
        // eslint-disable-next-line no-underscore-dangle
        fla => fla.nestedLevelRefId === level._refId), 'associatedLevelRefId'),
    })))

const mapFactorDTOsToFactorEntities = addErrorHandling('1AG000',
  (experimentId, factorDTOs, refFactorTypeId) =>
    _.map(factorDTOs, factorDTO => ({
      id: factorDTO.id,
      name: factorDTO.name,
      refFactorTypeId,
      experimentId,
      tier: factorDTO.tier,
      isBlockingFactorOnly: factorDTO.isBlockingFactorOnly,
    })))

const appendParentIdToChildren = addErrorHandling('1AH000',
  (parents, childArrayPropertyName, nameOfNewIdProperty) => _.map(parents,
    parent => ({
      [childArrayPropertyName]: _.map(parent[childArrayPropertyName],
        child => ({ [nameOfNewIdProperty]: parent.id, ...child })),
      ..._.omit(parent, childArrayPropertyName),
    })))

const concatChildArrays = addErrorHandling('1AI000',
  (parents, childArrayPropertyName) =>
    _.concat(..._.map(parents, parent => parent[childArrayPropertyName])))

class FactorDependentCompositeService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.factorLevelService = new FactorLevelService()
    this.factorLevelAssociationService = new FactorLevelAssociationService()
    this.factorService = new FactorService()
    this.dependentVariableService = new DependentVariableService()
    this.factorTypeService = new FactorTypeService()
    this.securityService = new SecurityService()
    this.variablesValidator = new VariablesValidator()
  }

  @setErrorCode('1AJ000')
  @Transactional('getFactorsWithLevels')
  static getFactorsWithLevels(experimentId, tx) {
    return tx.batch([
      FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId, tx),
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId, tx),
    ]).then(data => ({
      factors: data[0],
      levels: data[1],
    }))
  }

  @setErrorCode('1AK000')
  static extractLevelsForFactor(factor, allLevelsForAllFactors) {
    return _.filter(allLevelsForAllFactors, level =>
      Number(level.factor_id) === Number(factor.id),
    )
  }

  @setErrorCode('1AL000')
  static appendLevelIdToLevel(level) {
    return {
      id: level.id,
      items: level.value.items,
      objectType: level.value.objectType,
    }
  }

  @setErrorCode('1AM000')
  static findFactorType(factorTypes, factor) {
    return _.find(factorTypes, { id: factor.ref_factor_type_id }).type.toLowerCase()
  }

  @setErrorCode('1AN000')
  static assembleFactorLevelDTOs(factorLevels) {
    return _.map(
      factorLevels,
      level => FactorDependentCompositeService.appendLevelIdToLevel(level))
  }

  @setErrorCode('1AO000')
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
        nestedTreatmentVariables: _.isEmpty(nestedFactorDTOs) ? undefined : nestedFactorDTOs,
        associatedTreatmentVariables:
          _.isEmpty(associatedFactorDTOs) ? undefined : associatedFactorDTOs,
        type: FactorDependentCompositeService.findFactorType(allFactorTypes, factor),
        levels: FactorDependentCompositeService.assembleFactorLevelDTOs(factorLevels),
        tier: factor.tier,
        isBlockingFactorOnly: factor.is_blocking_factor_only,
      }
    })
  }

  @setErrorCode('1AP000')
  static mapDependentVariablesEntitiesToDTOs(dependentVariableEntities) {
    return _.map(dependentVariableEntities, dependentVariable => ({
      name: dependentVariable.name,
      required: dependentVariable.required,
      questionCode: dependentVariable.question_code,
    }))
  }

  @setErrorCode('1AQ000')
  static mapFactorLevelAssociationEntitiesToDTOs(factorLevelAssociationEntities) {
    return _.map(factorLevelAssociationEntities, factorLevelAssociationEntity => ({
      id: factorLevelAssociationEntity.id,
      associatedLevelId: factorLevelAssociationEntity.associated_level_id,
      nestedLevelId: factorLevelAssociationEntity.nested_level_id,
    }))
  }

  @setErrorCode('1AR000')
  static createVariablesObject(
    { independent = [] },
    responseVariables = [],
    treatmentVariableAssociations = []) {
    return {
      treatmentVariables: independent,
      responseVariables,
      treatmentVariableAssociations,
    }
  }

  @setErrorCode('1AS000')
  static assembleIndependentAndExogenous(factorDTOs) {
    return _.mapValues(_.groupBy(factorDTOs, factor => factor.type),
      factorsOfType => _.map(factorsOfType,
        factorOfType => _.omit(factorOfType, 'type')))
  }

  @setErrorCode('1AT000')
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

  @setErrorCode('1AU000')
  @Transactional('getAllVariablesByExperimentId')
  getAllVariablesByExperimentId(experimentId, isTemplate, context, tx) {
    return tx.batch(
      [
        ExperimentsService.verifyExperimentExists(experimentId, isTemplate, context, tx),
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

  @setErrorCode('1AV000')
  static mapDependentVariableDTO2DbEntity(dependentVariables, experimentId) {
    return _.map(dependentVariables, (dependentVariable) => {
      dependentVariable.experimentId = experimentId
      return dependentVariable
    })
  }

  @setErrorCode('1AW000')
  persistVariablesWithoutLevels(experimentId, dependentVariables, context, isTemplate, tx) {
    return this.dependentVariableService.deleteDependentVariablesForExperimentId(experimentId,
      isTemplate, context, tx)
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

  @setErrorCode('1AY000')
  persistDependentVariables(dependentVariables, experimentId, context, isTemplate, tx) {
    const dependentVariableEntities =
      FactorDependentCompositeService.mapDependentVariableDTO2DbEntity(
        dependentVariables, experimentId)
    return this.persistVariablesWithoutLevels(
      experimentId, dependentVariableEntities, context, isTemplate, tx)
  }

  @setErrorCode('1AZ000')
  deleteFactorsAndLevels =
    ({
      allDbFactors,
      allDbLevels,
      allIndependentDTOs: allFactorDTOs,
      allLevelDTOsWithParentFactorId: allLevelDTOs,
      tx,
      context,
    }) =>
      batchDeleteDbEntitiesWithoutMatchingDTO(
        allDbLevels, allLevelDTOs, this.factorLevelService.batchDeleteFactorLevels, context, tx)
        .then(() => batchDeleteDbEntitiesWithoutMatchingDTO(
          allDbFactors, allFactorDTOs, this.factorService.batchDeleteFactors, context, tx))

  @setErrorCode('1Aa000')
  updateFactors =
    (experimentId, allFactorDTOs, allFactorTypes, context, tx) =>
      applyAsyncBatchToNonEmptyArray(
        this.factorService.batchUpdateFactors,
        mapFactorDTOsToFactorEntities(
          experimentId,
          determineDTOsForUpdate(allFactorDTOs),
          getIdForFactorType(allFactorTypes, INDEPENDENT_VARIABLE_FACTOR_TYPE)),
        context,
        tx)

  @setErrorCode('1Ab000')
  updateLevels = (levelDTOsForUpdate, allFactorLevelAssociationDTOs, context, tx) =>
    applyAsyncBatchToNonEmptyArray(
      this.factorLevelService.batchUpdateFactorLevels,
      mapFactorLevelDTOsToFactorLevelEntities(levelDTOsForUpdate, allFactorLevelAssociationDTOs),
      context,
      tx)

  @setErrorCode('1Ac000')
  updateFactorsAndLevels = ({
    experimentId, allIndependentDTOs: allFactorDTOs, allFactorLevelAssociationDTOs,
    allLevelDTOsWithParentFactorIdForUpdate, allFactorTypes, context, tx,
  }) => tx.batch([
    this.updateFactors(
      experimentId, allFactorDTOs, allFactorTypes, context, tx),
    this.updateLevels(allLevelDTOsWithParentFactorIdForUpdate, allFactorLevelAssociationDTOs,
      context, tx),
  ])

  @setErrorCode('1Ad000')
  createFactorsAndDependentLevels = (
    {
      experimentId, factorDTOsForCreate, allFactorLevelAssociationDTOs, allFactorTypes, context, tx,
    }) => {
    const factorEntitiesForCreate = mapFactorDTOsToFactorEntities(
      experimentId,
      factorDTOsForCreate,
      getIdForFactorType(allFactorTypes, INDEPENDENT_VARIABLE_FACTOR_TYPE))
    return applyAsyncBatchToNonEmptyArray(
      this.factorService.batchCreateFactors,
      factorEntitiesForCreate,
      context,
      tx)
      .then((responses) => {
        const levelDTOsWithFactorIdForCreate =
          _.flatMap(factorDTOsForCreate, (factorDTO, index) =>
            _.map(factorDTO.levels, level => ({ factorId: responses[index].id, ...level })))
        return this.createFactorLevels(levelDTOsWithFactorIdForCreate,
          allFactorLevelAssociationDTOs, context, tx)
      })
  }

  @setErrorCode('1Ae000')
  createFactorLevels =
    (allFactorLevelDTOs, allFactorLevelAssociationDTOs, context, tx) =>
      applyAsyncBatchToNonEmptyArray(
        this.factorLevelService.batchCreateFactorLevels,
        mapFactorLevelDTOsToFactorLevelEntities(
          determineDTOsForCreate(allFactorLevelDTOs), allFactorLevelAssociationDTOs),
        context,
        tx)

  @setErrorCode('1Af000')
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

  @setErrorCode('1Ag000')
  getCurrentDbEntities = ({ experimentId, tx }) => tx.batch([
    FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId, tx),
    FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId, tx),
    FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(experimentId, tx),
    this.factorTypeService.getAllFactorTypes()])
    .then(formDbEntitiesObject)

  @setErrorCode('1Ah000')
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

  @setErrorCode('1Ai000')
  createFactorsAndLevels = params => params.tx.batch([
    this.createFactorsAndDependentLevels(params),
    this.createFactorLevels(
      params.factorIndependentLevelDTOsForCreate,
      params.allFactorLevelAssociationDTOs,
      params.context,
      params.tx)])

  @setErrorCode('1AJ000')
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
          context,
        }
        return this.deleteFactorsAndLevels(inputsAndDbEntities)
          .then(() => this.updateFactorsAndLevels(inputsAndDbEntities))
          .then(() => this.createFactorsAndLevels(inputsAndDbEntities))
          .then(([dependentLevelResponses, independentLevelResponses]) => {
            const refIdToIdMap = createCompleteRefIdToIdMap({
              ...inputsAndDbEntities,
              dependentLevelResponses,
              independentLevelResponses,
            })
            const inputsAndDbEntitiesWithRefIdToIdMap = {
              ...inputsAndDbEntities,
              refIdToIdMap,
            }
            return tx.batch([
              deleteFactorLevelAssociations(inputsAndDbEntitiesWithRefIdToIdMap),
              this.createFactorLevelAssociations(inputsAndDbEntitiesWithRefIdToIdMap),
            ])
          })
      })
  }

  @setErrorCode('1Ak000')
  persistIndependentAndDependentVariables = (
    experimentId, variables, context, isTemplate, tx) => tx.batch([
    this.persistIndependentAndAssociations(
      experimentId, variables.treatmentVariables,
      variables.treatmentVariableAssociations, context, tx),
    this.persistDependentVariables(
      variables.responseVariables, experimentId, context, isTemplate, tx)])

  @notifyChanges('update', 1)
  @setErrorCode('1Al000')
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

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
            return _.map(associations, (association) => {
              return hashTables.factorLevelHashById[association.nested_level_id].factor_id
            })
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
            return _.map(associations, (association) => {
              return hashTables.factorLevelHashById[association.associated_level_id].factor_id
            })
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
    return Promise.all([
      this.refDataSourceService.getRefDataSources(),
      FactorDependentCompositeService.getFactorsWithLevels(experimentId, tx),
    ]).then((results) => {
      const allDataSources = results[0]
      const data = results[1]
      const factorEntitiesFromRequest = _.map(independentVariables, factorDTO => ({
        id: factorDTO.id,
        name: factorDTO.name,
        refFactorTypeId: FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID,
        experimentId,
        tier: factorDTO.tier,
        refDataSourceId:
          FactorDependentCompositeService.determineDataSourceId(factorDTO.levels, allDataSources),
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
      return Promise.all([
        this.factorLevelService.batchDeleteFactorLevels(idsOfLevelsToDelete, tx),
        this.factorService.batchDeleteFactors(idsOfFactorsToDelete, tx)])
        .then(() => Promise.all([
          this.batchCreateFactorsAndDependentLevels(
            factorInsertsAndFactorDependentLevelInserts, context, tx),
          this.batchCreateFactorLevels(
            levelInsertsIndependentOfFactorInserts, context, tx)])
          .then(() => Promise.all([
            this.batchUpdateFactors(factorUpdates, context, tx),
            this.batchUpdateFactorLevels(levelUpdates, context, tx)])))
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
  persistAllVariablesOld(experimentVariables, experimentId, context, isTemplate, tx) {
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


















  getAllDbRefDataSources() {
    return this.refDataSourceService.getRefDataSources()
  }

  static getAllDbFactorsInExperiment(experimentId, tx) {
    return FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId, tx)
  }

  static getAllDbLevelsInExperiment(experimentId, tx) {
    return FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId, tx)
  }

  static getAllFactorLevelAssociationsInExperiment(experimentId, tx) {
    return FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(experimentId, tx)
  }

  static extractIds(sources) {
    return _.compact(_.map(sources, 'id'))
  }

  deleteLevelsHavingIds(levelIds, tx) {
    return _.isEmpty(levelIds)
      ? Promise.resolve([])
      : this.factorLevelService.batchDeleteFactorLevels(levelIds, tx)
  }

  deleteFactorsHavingIds(factorIds, tx) {
    return _.isEmpty(factorIds)
      ? Promise.resolve([])
      : this.factorService.batchDeleteFactors(factorIds, tx)
  }

  static batchUpdateEntities(entities, context, asyncBatchUpdateFunction, tx) {
    return _.isEmpty(entities)
      ? Promise.resolve([])
      : asyncBatchUpdateFunction(entities, context, tx)
  }

  static batchCreateEntities(entities, context, asyncBatchCreateFunction, tx) {
    return _.isEmpty(entities)
      ? Promise.resolve([])
      : asyncBatchCreateFunction(entities, context, tx)
  }

  static mapFactorLevelDTOsToFactorLevelEntities(allLevelDTOsWithParentFactorId) {
    return _.map(allLevelDTOsWithParentFactorId, level => ({
      id: level.id,
      value: _.omit(level, 'id'),
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
          levels: _.map(parent[childArrayPropertyName],
            child => ({ [nameOfNewIdProperty]: parent.id, ...child })),
          ..._.omit(parent, 'levels'),
        }))
  }

  static concatChildArrays(parents, childArrayPropertyName) {
    return _.concat(..._.map(parents, parent => parent[childArrayPropertyName]))
  }

  static determineIdsToDelete(entities, DTOs) {
    return _.difference(
      FactorDependentCompositeService.extractIds(entities),
      FactorDependentCompositeService.extractIds(DTOs),
    )
  }

  static deleteEntitiesWithoutMatchingDTO(entities, DTOs, asyncDeleteFunction, tx) {
    return asyncDeleteFunction(
      FactorDependentCompositeService.determineIdsToDelete(entities, DTOs), tx)
  }

  deleteFactorsAndLevels = (allDbFactors, allDbLevels, allFactorDTOs, allLevelDTOs, tx) => {
    const C = FactorDependentCompositeService
    return C.deleteEntitiesWithoutMatchingDTO(
      allDbLevels, allLevelDTOs, this.deleteLevelsHavingIds, tx).then(
      () => C.deleteEntitiesWithoutMatchingDTO(
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
    const factorDTOsForUpdate = C.determineDTOsForUpdate(allFactorDTOs)
    const factorEntitiesForUpdate = C.mapFactorDTOsToFactorEntities(
      experimentId, factorDTOsForUpdate, C.INDEPENDENT_VARIABLE_TYPE_ID, allDataSources)
    return C.batchUpdateEntities(factorEntitiesForUpdate, context,
      this.factorService.batchUpdateFactors.bind(this.factorService), tx)
  }

  updateLevels = (levelDTOsForUpdate, context, tx) => {
    const C = FactorDependentCompositeService
    const levelEntitiesForUpdate = C.mapFactorLevelDTOsToFactorLevelEntities(levelDTOsForUpdate)
    return C.batchUpdateEntities(levelEntitiesForUpdate, context,
      this.factorLevelService.batchUpdateFactorLevels.bind(this.factorLevelService), tx)
  }

  updateFactorsAndLevels = (
    experimentId, allDataSources, allFactorDTOs,
    levelDTOsWithParentFactorIdForUpdate, context, tx) => {
    return Promise.all([
      this.updateFactors(experimentId, allFactorDTOs, allDataSources, context, tx),
      this.updateLevels(levelDTOsWithParentFactorIdForUpdate, context, tx),
    ])
  }

  createFactorsAndDependentLevels = (
    experimentId, allDataSources, factorDTOsForCreate, context, tx) => {
    const C = FactorDependentCompositeService
    const factorEntitiesForCreate = C.mapFactorDTOsToFactorEntities(
      experimentId, factorDTOsForCreate,
      FactorDependentCompositeService.INDEPENDENT_VARIABLE_TYPE_ID, allDataSources)
    return C.batchCreateEntities(
      factorEntitiesForCreate, context, this.factorService.batchCreateFactors, tx)
      .then((factorIds) => {
        const levelDTOsWithFactorIdForCreate =
          _.map(factorDTOsForCreate, (factorDTO, index) =>
            _.map(factorDTO.levels, level => ({ factorId: factorIds[index], ...level })))
        return this.createFactorLevels(
          experimentId, allDataSources, levelDTOsWithFactorIdForCreate, context, tx)
      })
  }

  createFactorLevelsHavingParents(
    experimentId, allDataSources, levelDTOsWithFactorIdForCreate, context, tx) {
    return this.createFactorLevels(
      experimentId, allDataSources, levelDTOsWithFactorIdForCreate, context, tx)
  }

  createFactorLevels = (experimentId, allDataSources, allFactorLevelDTOs, context, tx) => {
    const C = FactorDependentCompositeService
    const factorLevelDTOsForCreate = C.determineDTOsForCreate(allFactorLevelDTOs)
    const factorLevelEntitiesForCreate = C.mapFactorLevelDTOsToFactorLevelEntities(
      factorLevelDTOsForCreate)
    return C.batchCreateEntities(factorLevelEntitiesForCreate, context,
      this.factorLevelService.batchCreateFactorLevels.bind(this.factorLevelService), tx)
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
    factorLevelAssociationDTOs){
    const C = FactorDependentCompositeService
    return _.map(_.differenceWith(
      factorLevelAssociationEntities,
      C.mapFactorLevelAssociationDTOToEntity(refIdToIdMap, factorLevelAssociationDTOs),
      (a, b) => a.associated_level_id === b.associatedLevelId
        && a.nested_level_id === b.nestedLevelId), 'id')
  }

  static determineFactorLevelAssociationEntitiesToCreate(
    refIdToIdMap,
    factorLevelAssociationEntities,
    factorLevelAssociationDTOs){
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
    return FactorLevelAssociationService.batchDeleteFactorLevelAssociations(
      C.determineFactorLevelAssociationIdsToDelete(
        refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs),
      tx)
  }

  createFactorLevelAssociations = (
    refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs, context, tx) => {
    const C = FactorDependentCompositeService
    const factorLevelAssociationsToCreate = C.determineFactorLevelAssociationEntitiesToCreate(
      refIdToIdMap, factorLevelAssociationEntities, factorLevelAssociationDTOs)
    return C.batchCreateEntities(factorLevelAssociationsToCreate, context,
      this.factorLevelAssociationService.batchCreateFactorLevelAssociations
        .bind(this.factorLevelAssociationService),
      tx)
  }

  static createRefIdToIdMap(refIdSource, idSource) {
    return _.zipObject(
      _.map(refIdSource, '_refId'),
      _.map(idSource, 'id'))
  }

  overall = (experimentId, allFactorDTOs, allFactorLevelAssociationDTOs, context, tx) => {
    const C = FactorDependentCompositeService
    const getCurrentDbState = Promise.all([
      this.getAllDbRefDataSources(),
      C.getAllDbFactorsInExperiment(experimentId, tx),
      C.getAllDbLevelsInExperiment(experimentId, tx),
      C.getAllFactorLevelAssociationsInExperiment(experimentId, tx),
    ])

    return getCurrentDbState.then(
      ([allDbRefDataSources, allDbFactors, allDbLevels, allDbFactorLevelAssociations]) => {
        const allLevelDTOsWithParentFactorId = C.concatChildArrays(
          C.appendParentIdToChildren(allFactorDTOs, 'levels', 'factorId'),
          'levels')
        const allLevelDTOsWithParentFactorIdForUpdate =
          C.determineDTOsForUpdate(allLevelDTOsWithParentFactorId)
        const factorDTOsForCreate = C.determineDTOsForCreate(allFactorDTOs)
        const factorDependentLevelDTOsForCreate =
          _.filter(allLevelDTOsWithParentFactorId, dto => _.isNil(dto.factorId))
        const factorIndependentLevelDTOsForCreate =
          _.filter(allLevelDTOsWithParentFactorId, dto => !_.isNil(dto.factorId) && _.isNil(dto.id))
        return this.deleteFactorsAndLevels(
          allDbFactors, allDbLevels, allFactorDTOs, allLevelDTOsWithParentFactorId, tx)
          .then(() => this.updateFactorsAndLevels(experimentId, allDbRefDataSources, allFactorDTOs,
            allLevelDTOsWithParentFactorIdForUpdate, context, tx))
          .then(Promise.all([
            this.createFactorsAndDependentLevels(experimentId, allDbRefDataSources,
              factorDTOsForCreate, context, tx),
            this.createFactorLevelsHavingParents(experimentId, allDbRefDataSources,
              factorIndependentLevelDTOsForCreate, context, tx)]))
          .then(([dependentLevelIds, independentLevelIds]) => {
            const finalRefIdMap = _.assign(
              C.createRefIdToIdMap(factorDependentLevelDTOsForCreate, dependentLevelIds),
              C.createRefIdToIdMap(factorIndependentLevelDTOsForCreate, independentLevelIds),
              C.createRefIdToIdMap(
                allLevelDTOsWithParentFactorIdForUpdate,
                allLevelDTOsWithParentFactorIdForUpdate))
            return Promise.all([
              C.deleteFactorLevelAssociations(
                finalRefIdMap, allDbFactorLevelAssociations, allFactorLevelAssociationDTOs, tx),
              this.createFactorLevelAssociations(
                finalRefIdMap, allDbFactorLevelAssociations, allFactorLevelAssociationDTOs,
                context, tx),
            ])
          })
      })
  }

  @Transactional('persistAllVariables')
  persistAllVariables(experimentVariables, experimentId, context, isTemplate, tx) {
    const expId = Number(experimentId)
    return this.securityService.permissionsCheck(expId, context, isTemplate, tx)
      .then(() => this.variablesValidator.validate(experimentVariables, 'POST', tx))
      .then(() => this.overall(
          expId,
          experimentVariables.independent,
          experimentVariables.independentAssociations,
          context,
          tx))
      .then(() => AppUtil.createPostResponse([{ id: expId }]))
  }
}

module.exports = FactorDependentCompositeService

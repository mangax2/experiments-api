import compact from 'lodash/compact'
import differenceWith from 'lodash/differenceWith'
import difference from 'lodash/difference'
import groupBy from 'lodash/groupBy'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import values from 'lodash/values'
import zip from 'lodash/zip'
import zipWith from 'lodash/zipWith'
import flatten from 'lodash/flatten'
import merge from 'lodash/merge'
import concat from 'lodash/concat'
import Transactional from '@monsantoit/pg-transactional'
import AppUtil from './utility/AppUtil'
import ExperimentsService from './ExperimentsService'
import FactorLevelService from './FactorLevelService'
import FactorService from './FactorService'
import DependentVariableService from './DependentVariableService'
import FactorLevelAssociationEntityUtil from '../repos/util/FactorLevelAssociationEntityUtil'
import FactorLevelEntityUtil from '../repos/util/FactorLevelEntityUtil'
import SecurityService from './SecurityService'
import VariablesValidator from '../validations/VariablesValidator'
import FactorLevelAssociationService from './FactorLevelAssociationService'
import { notifyChanges } from '../decorators/notifyChanges'
import { dbRead, dbWrite } from '../db/DbManager'

const { addErrorHandling, setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 1AXXXX
const INDEPENDENT_VARIABLE_FACTOR_TYPE = 'Independent'

const getIdForFactorType = addErrorHandling('1A1000',
  (factorTypes, type) => factorTypes.find(factorType => factorType.type === type).id)

const extractIds = addErrorHandling('1A2000',
  sources => compact((sources || []).map(source => source.id)))

const determineIdsToDelete = addErrorHandling('1A3000',
  (dbEntities, requestEntities) =>
    difference(extractIds(dbEntities), extractIds(requestEntities)))


const getEntitiesToUpdate = addErrorHandling('1A4000',
  requestEntities => (requestEntities || []).filter(entity => entity.id))

const getEntitiesToCreate = addErrorHandling('1A5000',
  requestEntities => (requestEntities || []).filter(entity => !entity.id))

const invokeAsyncFuncIfDataIsNotEmpty = addErrorHandling('1A6000',
  async (asyncBatchFunction, data, context, tx) =>
    (isEmpty(data) ? [] : asyncBatchFunction(data, context, tx)))

const deleteDbRecordsNotInRequest = addErrorHandling('1A7000',
  (dbEntities, requestEntities, asyncBatchDeleteFunction, context, tx) => {
    const idsToDelete = determineIdsToDelete(dbEntities, requestEntities)
    return invokeAsyncFuncIfDataIsNotEmpty(asyncBatchDeleteFunction, idsToDelete,
      context, tx)
  })

const createRefIdToIdMap = addErrorHandling('1A9000',
  (refIdSource, idSource) => {
    const refIdMap = {}
    refIdSource.forEach((source, index) => {
      // eslint-disable-next-line no-underscore-dangle
      refIdMap[source._refId] = idSource[index].id
    })
    return refIdMap
  })

const mapAllRefs = addErrorHandling('1AA000',
  (
    requestDependentLevelsToCreate,
    requestLevelsToCreate,
    requestLevelsToUpdate,
    dependentLevelResponses,
    independentLevelResponses,
  ) => ({
    ...createRefIdToIdMap(requestDependentLevelsToCreate, dependentLevelResponses),
    ...createRefIdToIdMap(requestLevelsToCreate, independentLevelResponses),
    ...createRefIdToIdMap(requestLevelsToUpdate, requestLevelsToUpdate),
  }))

const mapLevelAssociationRequestToDbFormat = addErrorHandling('1AB000',
  (refIdToIdMap, levelAssociationRequests) => (levelAssociationRequests || []).map(request => ({
    associatedLevelId: refIdToIdMap[request.associatedLevelRefId],
    nestedLevelId: refIdToIdMap[request.nestedLevelRefId],
  })))

const determineFactorLevelAssociationIdsToDelete = addErrorHandling('1AC000', (
  refIdToIdMap,
  dbLevelAssociations,
  requestLevelAssociations,
) => {
  const formattedLevelAssociations = mapLevelAssociationRequestToDbFormat(refIdToIdMap,
    requestLevelAssociations)
  const levelAssociationsToDelete = differenceWith(dbLevelAssociations,
    formattedLevelAssociations,
    (a, b) => (a.associated_level_id === b.associatedLevelId
      && a.nested_level_id === b.nestedLevelId))
  return levelAssociationsToDelete.map(la => la.id)
})

const getLevelAssociationsToCreate = addErrorHandling('1AD000', (
  (refIdToIdMap, dbFactorLevelAssociations, levelAssociationRequests) =>
    differenceWith(
      mapLevelAssociationRequestToDbFormat(refIdToIdMap, levelAssociationRequests),
      dbFactorLevelAssociations,
      (a, b) => a.associatedLevelId === b.associated_level_id
        && a.nestedLevelId === b.nested_level_id)))

const deleteFactorLevelAssociations = addErrorHandling('1AE000',
  (
    refIdToIdMap,
    dbFactorLevelAssociations,
    requestFactorLevelAssociations,
    tx,
  ) => {
    const idsToDelete = determineFactorLevelAssociationIdsToDelete(
      refIdToIdMap, dbFactorLevelAssociations, requestFactorLevelAssociations)
    return isEmpty(idsToDelete)
      ? Promise.resolve()
      : FactorLevelAssociationService.batchDeleteFactorLevelAssociations(
        idsToDelete,
        tx)
  })

const mapFactorLevelRequestsToDbFormat = addErrorHandling('1AF000',
  (requestLevelsWithParentFactorId, factorLevelAssociations) =>
    requestLevelsWithParentFactorId.map(level => ({
      id: level.id,
      value: { items: level.items, objectType: level.objectType },
      factorId: level.factorId,
      associatedFactorLevelRefIds: factorLevelAssociations.filter(
        // eslint-disable-next-line no-underscore-dangle
        fla => fla.nestedLevelRefId === level._refId).map(fla => fla.associatedLevelRefId),
    })))

const mapFactorRequestsToDbFormat = addErrorHandling('1AG000',
  (experimentId, factorRequests, refFactorTypeId) =>
    factorRequests.map(factorRequest => ({
      id: factorRequest.id,
      name: factorRequest.name,
      refFactorTypeId,
      experimentId,
      tier: factorRequest.tier,
      isBlockingFactorOnly: factorRequest.isBlockingFactorOnly,
    })))

const appendParentIdToChildren = addErrorHandling('1AH000',
  (parents, childArrayPropertyName, nameOfNewIdProperty) => (parents || []).map(
    parent => ({
      [childArrayPropertyName]: parent[childArrayPropertyName].map(
        child => ({ [nameOfNewIdProperty]: parent.id, ...child })),
      ...omit(parent, childArrayPropertyName),
    })))

const concatChildArrays = addErrorHandling('1AI000',
  (parents, childArrayPropertyName) =>
    [].concat(...parents.map(parent => parent[childArrayPropertyName])))

export const assembleIndependentAndExogenous = addErrorHandling('1AS000',
  requestFactors => mapValues(groupBy(requestFactors, factor => factor.type),
    factorsOfType => factorsOfType.map(factorOfType => omit(factorOfType, 'type'))))

export const mapDbFactorsToFactorResponseFormat = addErrorHandling('1AO000', (
  factors,
  allFactorLevels,
  factorTypes,
  dbFactorLevelAssociation,
) => {
  const factorHashById = keyBy(factors, 'id')
  const factorLevelHashById =
    FactorLevelEntityUtil.assembleFactorLevelHashById(allFactorLevels)
  return factors.map((factor) => {
    const factorLevels = extractLevelsForFactor(factor, allFactorLevels)
    const nestedFactorIds =
      FactorLevelAssociationEntityUtil.getNestedFactorIds(
        factorLevels,
        FactorLevelAssociationEntityUtil.assembleAssociationsGroupByAssociatedLevelId(
          dbFactorLevelAssociation),
        factorLevelHashById)
    const nestedFactorResponse = nestedFactorIds.map((factorId) => {
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
          dbFactorLevelAssociation),
        factorLevelHashById)
    const associatedFactorResponse = associatedFactorIds.map((factorId) => {
      const factorMatch = factorHashById[factorId]
      return {
        id: factorMatch.id,
        name: factorMatch.name,
      }
    })
    return {
      id: factor.id,
      name: factor.name,
      nestedTreatmentVariables:
        isEmpty(nestedFactorResponse) ? undefined : nestedFactorResponse,
      associatedTreatmentVariables:
        isEmpty(associatedFactorResponse) ? undefined : associatedFactorResponse,
      type: findFactorType(factorTypes, factor),
      levels: mapDbFactorLevelsToResponseFormat(factorLevels),
      tier: factor.tier,
      isBlockingFactorOnly: factor.is_blocking_factor_only,
    }
  })
})

export const mapDbDependentVariablesToResponseFormat = addErrorHandling('1AP000',
  dbDependentVariables => dbDependentVariables.map(dependentVariable => ({
    name: dependentVariable.name,
    required: dependentVariable.required,
    questionCode: dependentVariable.question_code,
  })))

export const mapDbFactorLevelAssociationToResponseFormat = addErrorHandling('1AQ000',
  dbFactorLevelAssociations =>
    dbFactorLevelAssociations.map(factorLevelAssociation => ({
      id: factorLevelAssociation.id,
      associatedLevelId: factorLevelAssociation.associated_level_id,
      nestedLevelId: factorLevelAssociation.nested_level_id,
    })))

export const convertDbLevelToResponseFormat = addErrorHandling('1AL000', level => ({
  id: level.id,
  items: level.value.items,
  objectType: level.value.objectType,
}))

export const getFactorsAndLevels = addErrorHandling('1AJ000', experimentId =>
  Promise.all([
    FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId),
    FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId),
  ]).then(([factors, levels]) => ({
    factors,
    levels,
  })))

export const extractLevelsForFactor = addErrorHandling('1AK000', (
  factor,
  allLevelsForAllFactors,
) => allLevelsForAllFactors.filter(level => Number(level.factor_id) === Number(factor.id)))

export const findFactorType = addErrorHandling('1AM000', (factorTypes, factor) =>
  factorTypes.find(factorType => factorType.id === factor.ref_factor_type_id)
    .type.toLowerCase())

export const mapDbFactorLevelsToResponseFormat = addErrorHandling('1AN000', factorLevels =>
  factorLevels.map(level => convertDbLevelToResponseFormat(level)))

export const formatVariablesForOutput = addErrorHandling('1AT000', (
  dbFactors,
  dbFactorLevels,
  factorTypes,
  dbDependentVariable,
  dbFactorLevelAssociation,
) => {
  const formattedFactors = mapDbFactorsToFactorResponseFormat(
    dbFactors, dbFactorLevels, factorTypes, dbFactorLevelAssociation)
  const { independent = [] } = assembleIndependentAndExogenous(formattedFactors)
  const responseVariables = mapDbDependentVariablesToResponseFormat(dbDependentVariable) || []
  const treatmentVariableAssociations = mapDbFactorLevelAssociationToResponseFormat(
    dbFactorLevelAssociation) || []

  return {
    treatmentVariables: independent,
    responseVariables,
    treatmentVariableAssociations,
  }
})

export const mapDependentVariableRequestToDbFormat = addErrorHandling('1AV000', (
  dependentVariables,
  experimentId,
) => (dependentVariables || []).map((dependentVariable) => {
  dependentVariable.experimentId = experimentId
  return dependentVariable
}))

class FactorDependentCompositeService {
  constructor() {
    this.experimentService = new ExperimentsService()
    this.factorLevelService = new FactorLevelService()
    this.factorLevelAssociationService = new FactorLevelAssociationService()
    this.factorService = new FactorService()
    this.dependentVariableService = new DependentVariableService()
    this.securityService = new SecurityService()
    this.variablesValidator = new VariablesValidator()
  }

  @setErrorCode('1AU000')
  getAllVariablesByExperimentId = async (experimentId, isTemplate, context) => {
    await ExperimentsService.verifyExperimentExists(experimentId, isTemplate, context)
    const [
      factorsAndLevels,
      factorTypes,
      dependentVariables,
      factorLevelAssociations,
    ] = await Promise.all(
      [
        getFactorsAndLevels(experimentId),
        dbRead.factorType.all(),
        DependentVariableService.getDependentVariablesByExperimentIdNoExistenceCheck(
          experimentId),
        FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(
          experimentId),
      ],
    )
    return formatVariablesForOutput(
      factorsAndLevels.factors,
      factorsAndLevels.levels,
      factorTypes,
      dependentVariables,
      factorLevelAssociations,
    )
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
    const dbDependentVariables = mapDependentVariableRequestToDbFormat(
      dependentVariables, experimentId)
    return this.persistVariablesWithoutLevels(
      experimentId, dbDependentVariables, context, isTemplate, tx)
  }

  @setErrorCode('1AZ000')
  deleteFactorsAndLevels = async (
    dbFactors,
    dbLevels,
    requestFactors,
    requestLevels,
    tx,
    context,
  ) => {
    await deleteDbRecordsNotInRequest(dbLevels, requestLevels,
      this.factorLevelService.batchDeleteFactorLevels, context, tx)
    await deleteDbRecordsNotInRequest(dbFactors, requestFactors,
      this.factorService.batchDeleteFactors, context, tx)
  }

  @setErrorCode('1Aa000')
  updateFactors = (experimentId, requestFactors, factorTypes, context, tx) => {
    const factorsToUpdate = getEntitiesToUpdate(requestFactors)
    const treatmentVariableTypeId = getIdForFactorType(factorTypes,
      INDEPENDENT_VARIABLE_FACTOR_TYPE)
    const formattedFactorsToUpdate = mapFactorRequestsToDbFormat(experimentId, factorsToUpdate,
      treatmentVariableTypeId)

    return invokeAsyncFuncIfDataIsNotEmpty(this.factorService.batchUpdateFactors,
      formattedFactorsToUpdate, context, tx)
  }

  @setErrorCode('1Ab000')
  updateLevels = (
    requestFactorLevels,
    requestFactorLevelAssociations,
    dbLevels,
    context,
    tx,
  ) => {
    const formattedRequestFactorLevels = mapFactorLevelRequestsToDbFormat(requestFactorLevels,
      requestFactorLevelAssociations)
    const mappedDbFactorLevels = keyBy(dbLevels, 'id')
    const factorLevelsWithChanges = formattedRequestFactorLevels.filter(factorLevel =>
      !isEqual(factorLevel.value, (mappedDbFactorLevels[factorLevel.id] || {}).value))

    return invokeAsyncFuncIfDataIsNotEmpty(this.factorLevelService.batchUpdateFactorLevels,
      factorLevelsWithChanges,
      context,
      tx)
  }

  @setErrorCode('1Ac000')
  updateFactorsAndLevels = async (
    experimentId,
    requestFactors,
    requestFactorLevelAssociations,
    requestLevelsToUpdate,
    factorTypes,
    dbLevels,
    context,
    tx,
  ) => {
    await this.updateFactors(experimentId, requestFactors, factorTypes, context, tx)
    await this.updateLevels(requestLevelsToUpdate, requestFactorLevelAssociations,
      dbLevels, context, tx)
  }

  @setErrorCode('1Ad000')
  createFactorsAndDependentLevels = async (
    experimentId,
    requestFactorsToCreate,
    requestFactorLevelAssociations,
    factorTypes,
    context,
    tx,
  ) => {
    const treatmentVariableTypeId = getIdForFactorType(factorTypes,
      INDEPENDENT_VARIABLE_FACTOR_TYPE)
    const formattedFactorsForCreate = mapFactorRequestsToDbFormat(experimentId,
      requestFactorsToCreate, treatmentVariableTypeId)
    const responses = await invokeAsyncFuncIfDataIsNotEmpty(
      this.factorService.batchCreateFactors, formattedFactorsForCreate, context, tx)
    const levelsToCreate = requestFactorsToCreate.flatMap((factor, index) =>
      factor.levels.map(level => ({ factorId: responses[index].id, ...level })))

    return this.createFactorLevels(levelsToCreate, requestFactorLevelAssociations, context, tx)
  }

  @setErrorCode('1Ae000')
  createFactorLevels =
    (requestFactorLevels, requestFactorLevelAssociations, context, tx) => {
      const factorLevelsToCreate = getEntitiesToCreate(requestFactorLevels)
      const formattedFactorsToCreate = mapFactorLevelRequestsToDbFormat(
        factorLevelsToCreate, requestFactorLevelAssociations)

      return invokeAsyncFuncIfDataIsNotEmpty(this.factorLevelService.batchCreateFactorLevels,
        formattedFactorsToCreate, context, tx)
    }

  @setErrorCode('1Af000')
  createFactorLevelAssociations = (
    refIdToIdMap,
    dbFactorLevelAssociations,
    requestFactorLevelAssociations,
    context,
    tx,
  ) => {
    const levelAssociationsToCreate = getLevelAssociationsToCreate(refIdToIdMap,
      dbFactorLevelAssociations, requestFactorLevelAssociations)
    return invokeAsyncFuncIfDataIsNotEmpty(
      this.factorLevelAssociationService.batchCreateFactorLevelAssociations,
      levelAssociationsToCreate, context, tx)
  }

  @setErrorCode('1Ag000')
  getCurrentDbEntities = experimentId =>
    Promise.all([
      FactorService.getFactorsByExperimentIdNoExistenceCheck(experimentId),
      FactorLevelService.getFactorLevelsByExperimentIdNoExistenceCheck(experimentId),
      FactorLevelAssociationService.getFactorLevelAssociationByExperimentId(experimentId),
      dbRead.factorType.all(),
    ])

  @setErrorCode('1Ah000')
  categorizeRequestFactorsAndLevels = (requestFactors) => {
    const requestLevels = concatChildArrays(
      appendParentIdToChildren(requestFactors, 'levels', 'factorId'),
      'levels')
    return {
      requestLevels,
      requestLevelsToUpdate: getEntitiesToUpdate(requestLevels),
      requestFactorsToCreate: getEntitiesToCreate(requestFactors),
      requestDependentLevelsToCreate: requestLevels.filter(level => !level.factorId),
      requestLevelsToCreate: requestLevels.filter(level => level.factorId && !level.id),
    }
  }

  @setErrorCode('1Ai000')
  createFactorsAndLevels = async (
    experimentId,
    requestFactorsToCreate,
    requestLevelsToCreate,
    requestFactorLevelAssociations,
    factorTypes,
    context,
    tx,
  ) => {
    const dbDependentLevels = await this.createFactorsAndDependentLevels(experimentId,
      requestFactorsToCreate, requestFactorLevelAssociations, factorTypes, context, tx)
    const dbFactorLevels = await this.createFactorLevels(requestLevelsToCreate,
      requestFactorLevelAssociations, context, tx)
    return [dbDependentLevels, dbFactorLevels]
  }

  @setErrorCode('1AJ000')
  persistIndependentAndAssociations = async (
    experimentId,
    requestFactors,
    requestFactorLevelAssociations,
    context,
    tx,
  ) => {
    this.factorLevelService.processFactorLevelValues(requestFactors)
    const [
      dbFactors,
      dbLevels,
      dbFactorLevelAssociations,
      factorTypes,
    ] = await this.getCurrentDbEntities(experimentId)

    const {
      requestDependentLevelsToCreate,
      requestFactorsToCreate,
      requestLevels,
      requestLevelsToCreate,
      requestLevelsToUpdate,
    } = this.categorizeRequestFactorsAndLevels(requestFactors)

    await this.deleteFactorsAndLevels(dbFactors, dbLevels, requestFactors, requestLevels,
      tx, context)
    await this.updateFactorsAndLevels(experimentId, requestFactors, requestFactorLevelAssociations,
      requestLevelsToUpdate, factorTypes, dbLevels, context, tx)

    const [
      dependentLevelResponses,
      independentLevelResponses,
    ] = await this.createFactorsAndLevels(experimentId, requestFactorsToCreate,
      requestLevelsToCreate, requestFactorLevelAssociations, factorTypes, context, tx)

    /*
     * In addition to storing factor levels in the factor_levels table, we now store them in a
     * different format in the factor_level_details and factor_properties_for_level table as well;
     * eventually the old table will be phased out in favor of this new design.
     *
     * Updates are done in a "total replacement" fashion, where all the old rows are deleted and
     * replaced.
     */

    // Do not execute if there are no factor levels
    if (requestLevels.length !== 0) {
      // Delete all rows in factorPropertiesForLevel and factorLevelDetails (uses ON DELETE CASCADE)
      await dbWrite.factorPropertiesForLevel.batchRemoveByExperimentId([experimentId], tx)

      // Await to get the factorIds for the factor levels and then stitch them into the objects
      let factorLevels = []
      const dependentIds = dependentLevelResponses.map(obj => obj.id)
      if (dependentIds.length > 0) {
        factorLevels = await dbWrite.factorLevel.batchFind(dependentIds, tx)
      }

      // Build the factor level group matrix
      const fLGMatrix = this.buildFLGMatrix(requestLevels, factorLevels)

      // Build properties for factor levels; await insert
      const propsForFactorLevels = this.buildPropsForFactorLevels(fLGMatrix)
      const propertyIds = await dbWrite.factorPropertiesForLevel.batchCreate(
        propsForFactorLevels, context, tx,
      )

      // Build factor level details; await insert
      const factorLevelDetails = this.buildFactorLevelDetails(
        fLGMatrix, propsForFactorLevels, propertyIds,
      )
      await dbWrite.factorLevelDetails.batchCreate(factorLevelDetails, context, tx)
    }

    const refIdToIdMap = mapAllRefs(requestDependentLevelsToCreate, requestLevelsToCreate,
      requestLevelsToUpdate, dependentLevelResponses, independentLevelResponses)
    await deleteFactorLevelAssociations(refIdToIdMap, dbFactorLevelAssociations,
      requestFactorLevelAssociations, tx)
    await this.createFactorLevelAssociations(refIdToIdMap, dbFactorLevelAssociations,
      requestFactorLevelAssociations, context, tx)
  }

  @setErrorCode('1Ak000')
  persistIndependentAndDependentVariables = async (
    experimentId,
    variables,
    context,
    isTemplate,
    tx,
  ) => {
    const {
      responseVariables,
      treatmentVariables,
      treatmentVariableAssociations,
    } = variables

    await this.persistIndependentAndAssociations(experimentId, treatmentVariables,
      treatmentVariableAssociations, context, tx)
    await this.persistDependentVariables(responseVariables, experimentId, context, isTemplate, tx)
  }

  @notifyChanges('update', 1)
  @setErrorCode('1Al000')
  @Transactional('persistAllVariables')
  persistAllVariables = async (
    experimentVariables,
    experimentIdString,
    context,
    isTemplate,
    tx,
  ) => {
    const experimentId = Number(experimentIdString)
    await this.securityService.permissionsCheck(experimentId, context, isTemplate)
    await this.variablesValidator.validate(experimentVariables, 'POST')
    await this.persistIndependentAndDependentVariables(experimentId, experimentVariables,
      context, isTemplate, tx)
    return AppUtil.createPostResponse([{ id: experimentId }])
  }

  @setErrorCode('1Am000')
  buildFLGMatrix = (requestLevels, factorLevels) => {
    // fLG = factorLevelGroups
    // fLGWithIds will have all the new and existing factor levels in it; the existing factor
    // levels will have an "id" and "factorId" key, but the new ones will not
    let fLGWithIds = requestLevels

    // If there are new factor levels created, their ids will be in dependentLevelResponses; we
    // need to add "id" and "factorId" values to them so they match the already-existing factor
    // level objects
    if (factorLevels.length > 0) {
      const factorLevelsGroup = zip(requestLevels.filter(obj => !obj.factorId), factorLevels)
      const newfLGWithIds = factorLevelsGroup.map(arrs => ({
        ...arrs[0],
        factorId: arrs[1].factor_id,
        id: arrs[1].id,
      }))

      // Combine the newly created factor levels with the existing ones
      fLGWithIds = concat(requestLevels.filter(obj => obj.factorId), newfLGWithIds)
    }

    // Group objects into seperate arrays by factorId
    return values(groupBy(fLGWithIds, factorLevel => factorLevel.factorId))
  }

  @setErrorCode('1An000')
  // For each factor level, build the properties table "schema" for the first array of items
  buildPropsForFactorLevels = fLGMatrix => flatten(fLGMatrix.map(factorLevel =>
    // Data from POST can be in two formats, a flat items array or multi-row items arrays; we just
    // need the first array for the properties
    (factorLevel[0].items[0].items || factorLevel[0].items).map((item, i) => ({
      ...item,
      factorId: factorLevel[0].factorId,
      order: i,
      // Question code logic:
      // 1. questionCode is in property data for single questionCode
      // 2. questionCode is in level detail data for multi-tag questions, multiQuestionTag is
      // in the property data
      questionCode: (!item.multiQuestionTag ? item.questionCode : null),
    })),
  ))

  @setErrorCode('1Ao000')
  buildFactorLevelDetails = (fLGMatrix, propertiesForFactorLevels, propertyIds) => {
    // pFFL = propertiesForFactorLevels
    // Add the propertyIds to the original propertiesForFactorLevels objects
    const pFFLWithIds = zipWith(propertiesForFactorLevels, propertyIds, (a, b) => merge(a, b))

    // Group objects into seperate arrays by factorId
    const pFFLMatrix = values(groupBy(pFFLWithIds, property => property.factorId))

    // Create a row in the details table for each "cell" inside a factor level
    const factorLevelDetails = []
    // For each group of factor levels
    fLGMatrix.forEach((factorLevelGroup, i) => {
      // For each factor level
      factorLevelGroup.forEach((factorLevel) => {
        // Set items assuming they are not multi-row format
        let { items } = factorLevel

        // If the items (cells) are multi-row, then flatten them
        if (factorLevel.items[0].items) {
          items = flatten(factorLevel.items.map((nestedItem, k) => nestedItem.items.map(
            ((cell, l) => ({
              ...cell,
              // The factorPropertiesForLevelId is in pFFLMatrix[factorGroup][column]
              factorPropertiesForLevelId: pFFLMatrix[i][l].id,
              // Set order by row, since there are multiple rows
              order: k,
            })),
          )))
        }

        // Build a row for each factor level detail
        items.forEach((cell, k) => {
          factorLevelDetails.push({
            ...cell,
            factorLevelId: factorLevel.id,
            // If the data is single-row, then the factorPropertiesForLevelId is in
            // pFFLMatrix[factorGroup][column]
            factorPropertiesForLevelId: cell.factorPropertiesForLevelId ?? pFFLMatrix[i][k].id,
            // If the data is single-row, the order is 0
            order: cell.order ?? 0,
            questionCode: (cell.multiQuestionTag ? cell.questionCode : null),
          })
        })
      })
    })

    return factorLevelDetails
  }
}

export default FactorDependentCompositeService
